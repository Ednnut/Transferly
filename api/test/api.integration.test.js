const { rmSync } = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const { Duplex } = require('node:stream');
const { after, before, beforeEach, describe, test } = require('node:test');

const sqlitePath = path.join(__dirname, '..', 'data', 'api-integration.sqlite');

process.env.NODE_ENV = 'test';
process.env.PORT = '3101';
process.env.SQLITE_DATABASE_PATH = sqlitePath;
process.env.REDIS_URL = 'redis://127.0.0.1:6379';
process.env.INLINE_QUEUE_MODE = 'true';
process.env.PAYPAL_CLIENT_ID = 'paypal-client-id';
process.env.PAYPAL_CLIENT_SECRET = 'paypal-client-secret';
process.env.PAYPAL_ENVIRONMENT = 'sandbox';
process.env.PAYPAL_WEBHOOK_ID = 'paypal-webhook-id';
process.env.MAX_SINGLE_PAYOUT = '1000';
process.env.DAILY_PAYOUT_LIMIT = '5000';
process.env.MAX_PAYOUTS_PER_HOUR = '5';
process.env.HIGH_RISK_COUNTRIES = '';
process.env.HIGH_RISK_CURRENCIES = '';
process.env.SUSPICIOUS_INVOICE_KEYWORDS = 'crypto,investment';
process.env.API_RATE_LIMIT_MAX = '120';
process.env.API_RATE_LIMIT_WINDOW_MS = '60000';
process.env.JOB_WAIT_MS = '5000';
process.env.ADMIN_API_TOKEN = 'admin-secret-token';
process.env.ADMIN_API_ACTOR_ID = 'admin-api';
process.env.USER_API_TOKENS = 'demo-user:user-demo-token,secondary-user:user-secondary-token';
process.env.SEED_USER_ID = 'demo-user';
process.env.SEED_USER_EMAIL = 'demo@flashing.local';
process.env.SEED_USER_NAME = 'Demo User';
process.env.SEED_USER_COUNTRY = 'US';
process.env.SEED_WALLET_CURRENCY = 'USD';
process.env.SEED_PENDING_BALANCE = '0';
process.env.SEED_AVAILABLE_BALANCE = '250000';
process.env.SEED_FROZEN_BALANCE = '0';
process.env.SEED_PAID_OUT_BALANCE = '0';
process.env.SEED_ADMIN_ACTOR_ID = 'admin-demo';

function removeSqliteArtifacts(filePath) {
  rmSync(filePath, { force: true });
  rmSync(`${filePath}-wal`, { force: true });
  rmSync(`${filePath}-shm`, { force: true });
}

removeSqliteArtifacts(sqlitePath);

const { createApp } = require('../app');
const { bootstrapService } = require('../services/bootstrapService');
const { close, db, initializeDatabase, loadSchemaSql } = require('../db');
const { faqRepository } = require('../repositories/faqRepository');
const { invoiceRepository } = require('../repositories/invoiceRepository');
const { invoiceTemplateRepository } = require('../repositories/invoiceTemplateRepository');
const { payoutRepository } = require('../repositories/payoutRepository');
const { paymentOpsIssueRepository } = require('../repositories/paymentOpsIssueRepository');
const { platformConfigRepository } = require('../repositories/platformConfigRepository');
const { profileRepository } = require('../repositories/profileRepository');
const { receiptRepository } = require('../repositories/receiptRepository');
const { telegramRepository } = require('../repositories/telegramRepository');
const { testimonialRepository } = require('../repositories/testimonialRepository');
const { userRepository } = require('../repositories/userRepository');
const { webhookEventRepository } = require('../repositories/webhookEventRepository');
const { opsService } = require('../services/opsService');

const originalFetch = global.fetch;
const originalGetQueueOverview = opsService.getQueueOverview;
const originalListDeadLetterJobs = opsService.listDeadLetterJobs;
let app;
let invoiceSequence = 0;
const sandboxInvoices = new Map();
let payoutSequence = 0;
const sandboxPayouts = new Map();
let sandboxReminderConfigurations = [];
const userTokens = {
  demoUser: 'user-demo-token',
  secondaryUser: 'user-secondary-token'
};
const adminToken = 'admin-secret-token';

function createDefaultReminderConfigurations() {
  return [
    {
      id: 'RC-BEFOREDUE0000001',
      type: 'BEFORE_DUE',
      status: 'ACTIVE',
      interval: {
        unit: 'DAY',
        value: 2
      },
      repetition: 1,
      metadata: {
        created_time: '2026-01-28T03:31:53Z',
        updated_time: '2026-01-28T03:31:53Z'
      },
      notification: {
        send_to_invoicer: false
      },
      links: []
    },
    {
      id: 'RC-AFTERDUE00000002',
      type: 'AFTER_DUE',
      status: 'ACTIVE',
      interval: {
        unit: 'DAY',
        value: 3
      },
      repetition: 2,
      metadata: {
        created_time: '2026-01-28T03:31:53Z',
        updated_time: '2026-01-28T03:31:53Z'
      },
      notification: {
        send_to_invoicer: true
      },
      links: []
    }
  ];
}

function createSandboxPayoutRecord(requestBody) {
  payoutSequence += 1;
  const item = requestBody.items?.[0] || {};
  const receiver = item.receiver || 'receiver@example.com';
  const kind =
    receiver === 'unclaimed@example.com'
      ? 'UNCLAIMED'
      : receiver === 'held@example.com'
        ? 'HELD'
        : 'SUCCESS';

  const batchId =
    kind === 'UNCLAIMED'
      ? 'PAYOUT-BATCH-UNCLAIMED'
      : kind === 'HELD'
        ? 'PAYOUT-BATCH-HELD'
        : 'PAYOUT-BATCH-123';
  const itemId =
    kind === 'UNCLAIMED'
      ? 'PAYOUT-ITEM-UNCLAIMED'
      : kind === 'HELD'
        ? 'PAYOUT-ITEM-HELD'
        : 'PAYOUT-ITEM-123';
  const itemStatus = kind === 'HELD' ? 'ONHOLD' : kind;

  const record = {
    batchId,
    itemId,
    batchStatus: 'SUCCESS',
    itemStatus,
    receiver,
    senderItemId: item.sender_item_id || `payout-test-item-${payoutSequence}`,
    currency: item.amount?.currency || 'USD',
    value: item.amount?.value || '25.00'
  };

  sandboxPayouts.set(batchId, record);
  sandboxPayouts.set(itemId, record);
  return record;
}

function jsonResponse(body, init = {}) {
  const status = init.status || 200;
  const payload = status === 204 || status === 205 || status === 304 ? null : JSON.stringify(body);

  return new Response(payload, {
    status,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {})
    }
  });
}

function installFetchStub() {
  global.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);

    if (url.hostname !== 'api-m.sandbox.paypal.com') {
      return originalFetch(input, init);
    }

    const pathname = url.pathname;

    if (pathname === '/v1/oauth2/token' && init.method === 'POST') {
      return jsonResponse({ access_token: 'sandbox-token', expires_in: 3600 });
    }

    if (pathname === '/v2/invoicing/invoices' && init.method === 'POST') {
      const requestBody = init.body ? JSON.parse(init.body) : {};
      invoiceSequence += 1;
      const invoiceId = `PP-INV-${String(invoiceSequence).padStart(3, '0')}`;
      const invoiceNumber = `INV-TEST-${String(invoiceSequence).padStart(3, '0')}`;
      const invoiceDate = requestBody.detail?.invoice_date || new Date().toISOString().slice(0, 10);
      const remoteInvoice = {
        id: invoiceId,
        status: 'DRAFT',
        detail: {
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          payment_term: requestBody.detail?.payment_term || undefined,
          note: requestBody.detail?.note || undefined,
          memo: requestBody.detail?.memo || undefined,
          metadata: {
            recipient_view_url: `https://www.sandbox.paypal.com/invoice/p/#${invoiceId}`
          }
        },
        items: requestBody.items || []
      };

      sandboxInvoices.set(invoiceId, remoteInvoice);
      return jsonResponse({ id: invoiceId, status: 'DRAFT' }, { status: 201 });
    }

    if (pathname.startsWith('/v2/invoicing/invoices/') && pathname.endsWith('/send') && init.method === 'POST') {
      const invoiceId = pathname.split('/')[4];
      const remoteInvoice = sandboxInvoices.get(invoiceId);
      if (!remoteInvoice) {
        throw new Error(`Unhandled PayPal invoice send for ${invoiceId}`);
      }

      remoteInvoice.status =
        remoteInvoice.detail?.invoice_date > new Date().toISOString().slice(0, 10) ? 'SCHEDULED' : 'SENT';
      return jsonResponse({}, { status: 202 });
    }

    if (pathname.startsWith('/v2/invoicing/invoices/') && pathname.endsWith('/remind') && init.method === 'POST') {
      return jsonResponse({ status: 'REMINDER_SENT' }, { status: 202 });
    }

    if (pathname.startsWith('/v2/invoicing/invoices/') && pathname.endsWith('/cancel-reminders') && init.method === 'POST') {
      return jsonResponse({}, { status: 204 });
    }

    if (pathname.startsWith('/v2/invoicing/invoices/') && pathname.endsWith('/cancel') && init.method === 'POST') {
      const invoiceId = pathname.split('/')[4];
      const remoteInvoice = sandboxInvoices.get(invoiceId);
      if (!remoteInvoice) {
        throw new Error(`Unhandled PayPal invoice cancel for ${invoiceId}`);
      }

      remoteInvoice.status = 'CANCELLED';
      return jsonResponse({}, { status: 202 });
    }

    if (pathname.startsWith('/v2/invoicing/invoices/') && pathname.endsWith('/generate-qr-code') && init.method === 'POST') {
      const invoiceId = pathname.split('/')[4];
      return jsonResponse({
        image_url_png: `https://www.sandbox.paypal.com/qr/${invoiceId}.png`,
        image_url_svg: `https://www.sandbox.paypal.com/qr/${invoiceId}.svg`
      });
    }

    if (pathname.startsWith('/v2/invoicing/invoices/') && init.method === 'GET') {
      const invoiceId = pathname.split('/').pop();
      const remoteInvoice = sandboxInvoices.get(invoiceId);

      if (!remoteInvoice) {
        throw new Error(`Unhandled PayPal invoice lookup for ${invoiceId}`);
      }

      return jsonResponse(remoteInvoice);
    }

    if (pathname === '/v2/invoicing/reminders' && init.method === 'GET') {
      const type = url.searchParams.get('type');
      const configurations = type
        ? sandboxReminderConfigurations.filter((configuration) => configuration.type === type)
        : sandboxReminderConfigurations;

      return jsonResponse({
        configurations
      });
    }

    if (pathname.startsWith('/v2/invoicing/reminders/') && init.method === 'GET') {
      const configurationId = pathname.split('/').pop();
      const configuration = sandboxReminderConfigurations.find((entry) => entry.id === configurationId);
      if (!configuration) {
        throw new Error(`Unhandled PayPal reminder configuration lookup for ${configurationId}`);
      }

      return jsonResponse(configuration);
    }

    if (pathname.startsWith('/v2/invoicing/reminders/') && init.method === 'PUT') {
      const configurationId = pathname.split('/').pop();
      const requestBody = init.body ? JSON.parse(init.body) : {};
      sandboxReminderConfigurations = sandboxReminderConfigurations.map((configuration) =>
        configuration.id === configurationId
          ? {
              ...configuration,
              type: requestBody.type,
              interval: requestBody.interval,
              repetition: requestBody.repetition,
              notification: requestBody.notification || {},
              metadata: {
                ...configuration.metadata,
                updated_time: '2026-05-08T01:00:00Z'
              }
            }
          : configuration
      );

      return jsonResponse({}, { status: 204 });
    }

    if (pathname.startsWith('/v2/invoicing/reminders/') && pathname.endsWith('/suspend') && init.method === 'POST') {
      const configurationId = pathname.split('/')[4];
      sandboxReminderConfigurations = sandboxReminderConfigurations.map((configuration) =>
        configuration.id === configurationId
          ? {
              ...configuration,
              status: 'INACTIVE',
              metadata: {
                ...configuration.metadata,
                updated_time: '2026-05-08T01:05:00Z'
              }
            }
          : configuration
      );

      return jsonResponse({}, { status: 204 });
    }

    if (pathname.startsWith('/v2/invoicing/reminders/') && pathname.endsWith('/resume') && init.method === 'POST') {
      const configurationId = pathname.split('/')[4];
      sandboxReminderConfigurations = sandboxReminderConfigurations.map((configuration) =>
        configuration.id === configurationId
          ? {
              ...configuration,
              status: 'ACTIVE',
              metadata: {
                ...configuration.metadata,
                updated_time: '2026-05-08T01:10:00Z'
              }
            }
          : configuration
      );

      return jsonResponse({}, { status: 204 });
    }

    if (pathname === '/v1/notifications/verify-webhook-signature' && init.method === 'POST') {
      return jsonResponse({ verification_status: 'SUCCESS' });
    }

    if (pathname === '/v1/payments/payouts' && init.method === 'POST') {
      const requestBody = init.body ? JSON.parse(init.body) : {};
      const record = createSandboxPayoutRecord(requestBody);
      return jsonResponse(
        {
          batch_header: {
            payout_batch_id: record.batchId,
            batch_status: 'PENDING'
          }
        },
        { status: 201 }
      );
    }

    if (pathname.startsWith('/v1/payments/payouts/') && init.method === 'GET') {
      const batchId = pathname.split('/').pop();
      const record = sandboxPayouts.get(batchId);
      if (!record) {
        throw new Error(`Unhandled PayPal payout batch lookup for ${batchId}`);
      }

      return jsonResponse({
        batch_header: {
          payout_batch_id: record.batchId,
          batch_status: record.batchStatus
        },
        items: [
          {
            payout_item_id: record.itemId,
            transaction_status: record.itemStatus
          }
        ]
      });
    }

    if (pathname.startsWith('/v1/payments/payouts-item/') && pathname.endsWith('/cancel') && init.method === 'POST') {
      const payoutItemId = pathname.split('/')[4];
      const record = sandboxPayouts.get(payoutItemId);
      if (!record) {
        throw new Error(`Unhandled PayPal payout item cancel for ${payoutItemId}`);
      }

      record.itemStatus = 'RETURNED';
      sandboxPayouts.set(record.batchId, record);
      sandboxPayouts.set(record.itemId, record);
      return jsonResponse({}, { status: 201 });
    }

    if (pathname.startsWith('/v1/payments/payouts-item/') && init.method === 'GET') {
      const payoutItemId = pathname.split('/').pop();
      const record = sandboxPayouts.get(payoutItemId);
      if (!record) {
        throw new Error(`Unhandled PayPal payout item lookup for ${payoutItemId}`);
      }

      return jsonResponse({
        payout_item_id: record.itemId,
        transaction_status: record.itemStatus,
        errors: record.itemStatus === 'ONHOLD' ? { name: 'REGULATORY_PENDING' } : undefined,
        payout_item: {
          sender_item_id: record.senderItemId
        }
      });
    }

    throw new Error(`Unhandled fetch stub for ${init.method || 'GET'} ${url.toString()}`);
  };
}

function createMockSocket() {
  const socket = new Duplex({
    read() {},
    write(_chunk, _encoding, callback) {
      callback();
    },
    writev(_items, callback) {
      callback();
    }
  });
  const realDestroy = socket.destroy.bind(socket);

  socket.remoteAddress = '127.0.0.1';
  socket.writable = true;
  socket.readable = true;
  socket.destroy = (error) => {
    if (error) {
      return realDestroy(error);
    }

    return socket;
  };
  socket.destroySoon = socket.destroy.bind(socket);
  socket.forceDestroy = realDestroy;

  return socket;
}

async function injectRequest(targetApp, { method = 'GET', url = '/', headers = {}, body } = {}) {
  const bodyChunks = [];
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  const socket = createMockSocket();
  const request = new http.IncomingMessage(socket);
  request.method = method;
  request.url = url;
  request.headers = normalizedHeaders;
  request.connection = socket;
  request.socket = socket;
  request.httpVersion = '1.1';
  request.httpVersionMajor = 1;
  request.httpVersionMinor = 1;

  if (body) {
    request.push(Buffer.from(body));
  }

  request.push(null);

  const response = new http.ServerResponse(request);
  response.assignSocket(socket);

  const done = new Promise((resolve, reject) => {
    const originalWrite = response.write.bind(response);
    response.write = (chunk, encoding, callback) => {
      if (chunk) {
        bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }

      return originalWrite(chunk, encoding, callback);
    };

    const originalEnd = response.end.bind(response);
    response.end = (chunk, encoding, callback) => {
      if (chunk) {
        bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }

      const result = originalEnd(chunk, encoding, callback);

      setImmediate(() => {
        const payload = Buffer.concat(bodyChunks).toString('utf8');
        socket.forceDestroy();

        resolve({
          status: response.statusCode,
          headers: response.getHeaders(),
          bodyText: payload,
          json() {
            return payload ? JSON.parse(payload) : null;
          }
        });
      });

      return result;
    };

    response.on('error', reject);
  });

  targetApp.handle(request, response, (error) => {
    if (error) {
      response.destroy(error);
    }
  });

  return done;
}

function jsonHeaders(payload, headers = {}) {
  return {
    'content-type': 'application/json',
    'content-length': String(Buffer.byteLength(payload)),
    ...headers
  };
}

function bearerHeaders(token, headers = {}) {
  return {
    authorization: `Bearer ${token}`,
    ...headers
  };
}

async function resetDatabase() {
  await db.exec(`
    DELETE FROM telegram_command_logs;
    DELETE FROM telegram_accounts;
    DELETE FROM risk_flags;
    DELETE FROM ledger_entries;
    DELETE FROM email_dispatches;
    DELETE FROM referral_events;
    DELETE FROM top_up_orders;
    DELETE FROM points_transactions;
    DELETE FROM receipts;
    DELETE FROM payouts;
    DELETE FROM payout_batches;
    DELETE FROM invoices;
    DELETE FROM audit_logs;
    DELETE FROM webhook_events;
    DELETE FROM testimonials;
    DELETE FROM faqs;
    DELETE FROM platform_config;
    DELETE FROM wallets;
    DELETE FROM users;
  `);
}

before(async () => {
  installFetchStub();
  await initializeDatabase();
  await db.exec(loadSchemaSql());

  app = createApp();
});

beforeEach(async () => {
  opsService.getQueueOverview = originalGetQueueOverview;
  opsService.listDeadLetterJobs = originalListDeadLetterJobs;
  await resetDatabase();
  invoiceSequence = 0;
  sandboxInvoices.clear();
  payoutSequence = 0;
  sandboxPayouts.clear();
  sandboxReminderConfigurations = createDefaultReminderConfigurations();
  await bootstrapService.ensureDemoAccount();
  await bootstrapService.ensureDemoAccount({
    userId: 'secondary-user',
    email: 'secondary@flashing.local',
    displayName: 'Secondary User',
    availableBalanceCents: 125000,
    adminActorId: 'admin-demo'
  });
});

after(async () => {
  global.fetch = originalFetch;
  opsService.getQueueOverview = originalGetQueueOverview;
  opsService.listDeadLetterJobs = originalListDeadLetterJobs;
  await close();
  removeSqliteArtifacts(sqlitePath);
});

describe('API integration flows', () => {
  test('user routes require bearer auth when USER_API_TOKENS are configured', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Consulting retainer',
      items: [
        {
          name: 'Consulting',
          description: 'April retainer',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const response = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload),
      body: payload
    });

    assert.equal(response.status, 401);
    const body = response.json();
    assert.equal(body.code, 'USER_AUTH_REQUIRED');
  });

  test('GET /api/bootstrap exposes public platform, FAQ, and testimonial content', async () => {
    const response = await injectRequest(app, {
      method: 'GET',
      url: '/api/bootstrap'
    });

    assert.equal(response.status, 200);
    const body = response.json();
    assert.equal(body.platform.platform_name, 'Transferly');
    assert.ok(Array.isArray(body.faqs));
    assert.ok(Array.isArray(body.testimonials));
  });

  test('GET /api/me requires a user bearer token and returns the current user snapshot', async () => {
    const unauthorizedResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/me'
    });

    assert.equal(unauthorizedResponse.status, 401);
    assert.equal(unauthorizedResponse.json().code, 'USER_AUTH_REQUIRED');

    const receiptPayload = JSON.stringify({
      type: 'bank',
      title: 'My first receipt',
      details: {
        merchant: 'SlipCraft Store',
        amount: '$19.99'
      }
    });

    const receiptResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/receipt/generate',
      headers: jsonHeaders(receiptPayload, bearerHeaders(userTokens.demoUser)),
      body: receiptPayload
    });

    assert.equal(receiptResponse.status, 201);

    const response = await injectRequest(app, {
      method: 'GET',
      url: '/api/me',
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(response.status, 200);
    const body = response.json();
    assert.equal(body.user.id, 'demo-user');
    assert.equal(body.points.user_id, 'demo-user');
    assert.equal(body.points.receipt_count, 1);
    assert.equal(body.receipts.length, 1);
    assert.equal(body.referrals.user_id, 'demo-user');
    assert.ok(Array.isArray(body.topUpOrders));
  });

  test('top-up order endpoints persist user funding orders and require admin completion for point credit', async () => {
    const createPayload = JSON.stringify({
      points: 250,
      amountLabel: '250 pts',
      methodId: 'bank-transfer',
      methodTitle: 'Bank Transfer (P2P)',
      serviceIntent: 'paypal',
      instructions: 'Send proof to support',
      vendorUrl: 'https://t.me/example'
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/user/me/top-up-orders',
      headers: jsonHeaders(createPayload, bearerHeaders(userTokens.demoUser)),
      body: createPayload
    });

    assert.equal(createResponse.status, 201);
    const createdOrder = createResponse.json().order;
    assert.equal(createdOrder.user_id, 'demo-user');
    assert.equal(createdOrder.status, 'pending');
    assert.equal(createdOrder.points, 250);

    const submitPayload = JSON.stringify({ status: 'awaiting_confirmation' });
    const submitResponse = await injectRequest(app, {
      method: 'PATCH',
      url: `/api/user/me/top-up-orders/${createdOrder.order_id}/status`,
      headers: jsonHeaders(submitPayload, bearerHeaders(userTokens.demoUser)),
      body: submitPayload
    });

    assert.equal(submitResponse.status, 200);
    assert.equal(submitResponse.json().order.status, 'awaiting_confirmation');

    const userCompletePayload = JSON.stringify({ status: 'completed' });
    const userCompleteResponse = await injectRequest(app, {
      method: 'PATCH',
      url: `/api/user/me/top-up-orders/${createdOrder.order_id}/status`,
      headers: jsonHeaders(userCompletePayload, bearerHeaders(userTokens.demoUser)),
      body: userCompletePayload
    });

    assert.equal(userCompleteResponse.status, 400);

    const adminListResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/top-up-orders?status=awaiting_confirmation',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(adminListResponse.status, 200);
    assert.equal(adminListResponse.json().data.length, 1);

    const completeResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/top-up-orders/${createdOrder.order_id}/complete`,
      headers: jsonHeaders('{}', bearerHeaders(adminToken)),
      body: '{}'
    });

    assert.equal(completeResponse.status, 200);
    assert.equal(completeResponse.json().order.status, 'completed');

    const profile = await profileRepository.findByUserId('demo-user');
    assert.equal(profile.points, 750);

    const snapshotResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/me',
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(snapshotResponse.status, 200);
    assert.equal(snapshotResponse.json().topUpOrders[0].status, 'completed');
  });

  test('PATCH /api/user/me/profile updates the authenticated user profile', async () => {
    const payload = JSON.stringify({
      name: 'Renamed Demo User'
    });

    const response = await injectRequest(app, {
      method: 'PATCH',
      url: '/api/user/me/profile',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(response.status, 200);
    const body = response.json();
    assert.equal(body.user.displayName, 'Renamed Demo User');

    const profile = await profileRepository.findByUserId('demo-user');
    assert.equal(profile.name, 'Renamed Demo User');

    const user = await userRepository.findById('demo-user');
    assert.equal(user.displayName, 'Renamed Demo User');
  });

  test('POST /api/user/me/password rotates account credentials for authenticated users', async () => {
    const registerPayload = JSON.stringify({
      email: 'password-rotate@example.com',
      password: 'strongpassword123',
      name: 'Password Rotate User',
      countryCode: 'US'
    });

    const registerResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/auth/register',
      headers: jsonHeaders(registerPayload),
      body: registerPayload
    });

    assert.equal(registerResponse.status, 201);
    const registerBody = registerResponse.json();

    const passwordPayload = JSON.stringify({
      newPassword: 'newstrongpassword456'
    });

    const passwordResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/user/me/password',
      headers: jsonHeaders(passwordPayload, bearerHeaders(registerBody.token)),
      body: passwordPayload
    });

    assert.equal(passwordResponse.status, 200);
    assert.equal(passwordResponse.json().password_updated, true);

    const oldLoginPayload = JSON.stringify({
      email: 'password-rotate@example.com',
      password: 'strongpassword123'
    });

    const oldLoginResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: jsonHeaders(oldLoginPayload),
      body: oldLoginPayload
    });

    assert.equal(oldLoginResponse.status, 401);

    const newLoginPayload = JSON.stringify({
      email: 'password-rotate@example.com',
      password: 'newstrongpassword456'
    });

    const newLoginResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: jsonHeaders(newLoginPayload),
      body: newLoginPayload
    });

    assert.equal(newLoginResponse.status, 200);
    assert.equal(newLoginResponse.json().user.email, 'password-rotate@example.com');
  });

  test('DELETE /api/user/me removes the authenticated account', async () => {
    const registerPayload = JSON.stringify({
      email: 'delete-account@example.com',
      password: 'strongpassword123',
      name: 'Delete Me',
      countryCode: 'US'
    });

    const registerResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/auth/register',
      headers: jsonHeaders(registerPayload),
      body: registerPayload
    });

    assert.equal(registerResponse.status, 201);
    const registerBody = registerResponse.json();

    const deleteResponse = await injectRequest(app, {
      method: 'DELETE',
      url: '/api/user/me',
      headers: bearerHeaders(registerBody.token)
    });

    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.json().deleted, true);

    const deletedUser = await userRepository.findById(registerBody.user.id);
    assert.equal(deletedUser, null);

    const loginPayload = JSON.stringify({
      email: 'delete-account@example.com',
      password: 'strongpassword123'
    });

    const loginResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: jsonHeaders(loginPayload),
      body: loginPayload
    });

    assert.equal(loginResponse.status, 401);
  });

  test('admin user endpoints enforce admin auth and allow manual point adjustments', async () => {
    const unauthorizedResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/users',
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(unauthorizedResponse.status, 401);
    assert.equal(unauthorizedResponse.json().code, 'ADMIN_AUTH_REQUIRED');

    const listResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/users',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(listResponse.status, 200);
    const listBody = listResponse.json();
    assert.ok(listBody.data.some((user) => user.user_id === 'demo-user'));

    const adjustmentPayload = JSON.stringify({
      delta: 15,
      reason: 'Support credit'
    });

    const adjustmentResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/admin/users/demo-user/points',
      headers: jsonHeaders(adjustmentPayload, bearerHeaders(adminToken)),
      body: adjustmentPayload
    });

    assert.equal(adjustmentResponse.status, 200);
    const adjustmentBody = adjustmentResponse.json();
    assert.equal(adjustmentBody.user.user_id, 'demo-user');
    assert.equal(adjustmentBody.user.points, 515);

    const pointsResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/user/demo-user/points',
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(pointsResponse.status, 200);
    assert.equal(pointsResponse.json().points, 515);

    const profile = await profileRepository.findByUserId('demo-user');
    assert.equal(profile.points, 515);
  });

  test('PATCH /api/admin/config updates platform content settings', async () => {
    const payload = JSON.stringify({
      tagline: 'Receipts built faster',
      brand_color: '#ff7a18',
      bank_slip_cost: 19,
      payout_minimum_cents: 2500,
      payout_fee_fixed_cents: 175,
      payout_fee_percentage_bps: 150,
      payout_manual_review_cents: 50000,
      helpFAQ: [
        {
          question: 'Updated help',
          answer: 'Use the admin tools.'
        }
      ]
    });

    const response = await injectRequest(app, {
      method: 'PATCH',
      url: '/api/admin/config',
      headers: jsonHeaders(payload, bearerHeaders(adminToken)),
      body: payload
    });

    assert.equal(response.status, 200);
    const body = response.json();
    assert.equal(body.config.tagline, 'Receipts built faster');
    assert.equal(body.config.brand_color, '#ff7a18');
    assert.equal(body.config.bank_slip_cost, 19);
    assert.equal(body.config.payout_minimum_cents, 2500);
    assert.equal(body.config.payout_fee_fixed_cents, 175);
    assert.equal(body.config.payout_fee_percentage_bps, 150);
    assert.equal(body.config.payout_manual_review_cents, 50000);

    const config = await platformConfigRepository.get();
    assert.equal(config.tagline, 'Receipts built faster');
    assert.equal(config.brand_color, '#ff7a18');
    assert.equal(config.bank_slip_cost, 19);
    assert.equal(config.payout_minimum_cents, 2500);
    assert.equal(config.payout_fee_fixed_cents, 175);
    assert.equal(config.payout_fee_percentage_bps, 150);
    assert.equal(config.payout_manual_review_cents, 50000);
    assert.deepEqual(config.helpFAQ, [{ question: 'Updated help', answer: 'Use the admin tools.' }]);
    assert.equal(
      config.help_faq,
      JSON.stringify([{ question: 'Updated help', answer: 'Use the admin tools.' }])
    );
  });

  test('admin FAQ endpoints support create, update, and delete', async () => {
    const createPayload = JSON.stringify({
      question: 'How do I sync payouts?',
      answer: 'Open the payouts dashboard.',
      order_index: 7
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/admin/faqs',
      headers: jsonHeaders(createPayload, bearerHeaders(adminToken)),
      body: createPayload
    });

    assert.equal(createResponse.status, 201);
    const createBody = createResponse.json();
    const faqId = createBody.faq.id;
    assert.equal(createBody.faq.order_index, 7);

    const updatePayload = JSON.stringify({
      answer: 'Use the admin dashboard sync action.',
      order_index: 8
    });

    const updateResponse = await injectRequest(app, {
      method: 'PATCH',
      url: `/api/admin/faqs/${faqId}`,
      headers: jsonHeaders(updatePayload, bearerHeaders(adminToken)),
      body: updatePayload
    });

    assert.equal(updateResponse.status, 200);
    const updateBody = updateResponse.json();
    assert.equal(updateBody.faq.answer, 'Use the admin dashboard sync action.');
    assert.equal(updateBody.faq.order_index, 8);

    const deleteResponse = await injectRequest(app, {
      method: 'DELETE',
      url: `/api/admin/faqs/${faqId}`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.json().deleted, true);
    assert.equal(await faqRepository.findById(faqId), null);
  });

  test('admin testimonial endpoints support create, update, and delete', async () => {
    const createPayload = JSON.stringify({
      name: 'Jordan Vale',
      role: 'Seller',
      avatar: 'JV',
      content: 'This platform is fast.',
      rating: 5,
      order_index: 4,
      is_active: true
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/admin/testimonials',
      headers: jsonHeaders(createPayload, bearerHeaders(adminToken)),
      body: createPayload
    });

    assert.equal(createResponse.status, 201);
    const createBody = createResponse.json();
    const testimonialId = createBody.testimonial.id;
    assert.equal(createBody.testimonial.order_index, 4);
    assert.equal(createBody.testimonial.avatar, 'JV');

    const updatePayload = JSON.stringify({
      content: 'This platform is fast and reliable.',
      order_index: 5,
      is_active: false
    });

    const updateResponse = await injectRequest(app, {
      method: 'PATCH',
      url: `/api/admin/testimonials/${testimonialId}`,
      headers: jsonHeaders(updatePayload, bearerHeaders(adminToken)),
      body: updatePayload
    });

    assert.equal(updateResponse.status, 200);
    const updateBody = updateResponse.json();
    assert.equal(updateBody.testimonial.content, 'This platform is fast and reliable.');
    assert.equal(updateBody.testimonial.order_index, 5);
    assert.equal(updateBody.testimonial.is_active, false);

    const deleteResponse = await injectRequest(app, {
      method: 'DELETE',
      url: `/api/admin/testimonials/${testimonialId}`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.json().deleted, true);
    assert.equal(await testimonialRepository.findById(testimonialId), null);
  });

  test('admin invoice template endpoints support create, update, and delete', async () => {
    const createPayload = JSON.stringify({
      name: 'Consulting Retainer',
      description: 'Monthly consulting template',
      currency_code: 'USD',
      default_due_days: 14,
      line_items: [
        {
          name: 'Consulting',
          description: 'Monthly advisory',
          quantity: 1,
          unitAmount: 450
        }
      ],
      is_active: true
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/admin/invoice-templates',
      headers: jsonHeaders(createPayload, bearerHeaders(adminToken)),
      body: createPayload
    });

    assert.equal(createResponse.status, 201);
    const createBody = createResponse.json();
    const templateId = createBody.template.id;
    assert.equal(createBody.template.currency_code, 'USD');
    assert.equal(createBody.template.line_items.length, 1);

    const updatePayload = JSON.stringify({
      description: 'Updated consulting template',
      is_active: false
    });

    const updateResponse = await injectRequest(app, {
      method: 'PATCH',
      url: `/api/admin/invoice-templates/${templateId}`,
      headers: jsonHeaders(updatePayload, bearerHeaders(adminToken)),
      body: updatePayload
    });

    assert.equal(updateResponse.status, 200);
    const updatedTemplate = updateResponse.json().template;
    assert.equal(updatedTemplate.description, 'Updated consulting template');
    assert.equal(updatedTemplate.is_active, false);

    const listResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/invoice-templates',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(listResponse.status, 200);
    assert.equal(listResponse.json().data.length, 1);

    const deleteResponse = await injectRequest(app, {
      method: 'DELETE',
      url: `/api/admin/invoice-templates/${templateId}`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.json().deleted, true);
    assert.equal(await invoiceTemplateRepository.findById(templateId), null);
  });

  test('admin invoice reminder configuration endpoints support list, update, suspend, and resume', async () => {
    const listResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/invoice-reminders',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(listResponse.status, 200);
    const configurations = listResponse.json().data;
    assert.equal(configurations.length, 2);

    const target = configurations.find((configuration) => configuration.type === 'AFTER_DUE');
    assert.ok(target);

    const updatePayload = JSON.stringify({
      type: 'AFTER_DUE',
      interval: {
        unit: 'DAY',
        value: 5
      },
      repetition: 3,
      notification: {
        send_to_invoicer: false
      }
    });

    const updateResponse = await injectRequest(app, {
      method: 'PUT',
      url: `/api/admin/invoice-reminders/${target.id}`,
      headers: jsonHeaders(updatePayload, bearerHeaders(adminToken)),
      body: updatePayload
    });

    assert.equal(updateResponse.status, 200);
    assert.equal(updateResponse.json().configuration.interval.value, 5);
    assert.equal(updateResponse.json().configuration.repetition, 3);
    assert.equal(updateResponse.json().configuration.notification.send_to_invoicer, false);

    const suspendResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/invoice-reminders/${target.id}/suspend`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(suspendResponse.status, 200);
    assert.equal(suspendResponse.json().configuration.status, 'INACTIVE');

    const resumeResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/invoice-reminders/${target.id}/resume`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(resumeResponse.status, 200);
    assert.equal(resumeResponse.json().configuration.status, 'ACTIVE');
  });

  test('POST /api/invoices can create an official PayPal invoice from a stored template', async () => {
    const template = await invoiceTemplateRepository.create({
      name: 'Template Invoice',
      description: 'Template-backed invoice',
      currency_code: 'USD',
      default_due_days: 7,
      line_items: [
        {
          name: 'Implementation',
          description: 'Phase 1',
          quantity: 2,
          unitAmount: 125
        }
      ],
      metadata: {
        department: 'ops'
      },
      is_active: true
    });

    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      templateId: template.id
    });

    const response = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(response.status, 201);
    const body = response.json();
    assert.equal(body.template_id, template.id);
    assert.equal(body.summary.amount, '250.00');
    assert.equal(body.summary.currency, 'USD');
    assert.equal(body.metadata.invoice_template.id, template.id);
    assert.equal(body.metadata.department, 'ops');

    const invoice = await invoiceRepository.findByPaypalInvoiceId(body.invoice_id);
    assert.equal(invoice.templateId, template.id);
    assert.equal(invoice.amountCents, 25000);
    assert.ok(invoice.dueDate);
  });

  test('POST /api/invoices returns the PayPal payment link and persists the invoice', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Consulting retainer',
      items: [
        {
          name: 'Consulting',
          description: 'April retainer',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const response = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(response.status, 201);
    const body = response.json();
    assert.equal(body.invoice_id, 'PP-INV-001');
    assert.equal(body.status, 'SENT');
    assert.equal(body.invoice_link, 'https://www.sandbox.paypal.com/invoice/p/#PP-INV-001');

    const invoice = await invoiceRepository.findByPaypalInvoiceId('PP-INV-001');
    assert.ok(invoice);
    assert.equal(invoice.invoiceUrl, body.invoice_link);
    assert.equal(invoice.amountCents, 12500);
  });

  test('POST /api/invoices schedules the official PayPal send when issueDate is in the future', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Scheduled consulting retainer',
      issueDate: '2099-01-15',
      items: [
        {
          name: 'Consulting',
          description: 'Future retainer',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const response = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(response.status, 201);
    const body = response.json();
    assert.equal(body.status, 'SCHEDULED');
    assert.equal(body.summary.issue_date, '2099-01-15');

    const invoice = await invoiceRepository.findByPaypalInvoiceId(body.invoice_id);
    assert.equal(invoice.status, 'SCHEDULED');
    assert.equal(invoice.issueDate, '2099-01-15');
  });

  test('payment issues endpoint exposes overdue invoices found during official PayPal sync', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Overdue invoice',
      dueDate: '2020-01-01T00:00:00.000Z',
      items: [
        {
          name: 'Support',
          description: 'Legacy support',
          quantity: 1,
          unitAmount: 75
        }
      ]
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(createResponse.status, 201);
    const createdInvoice = createResponse.json();

    const refreshResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/refresh`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(refreshResponse.status, 200);

    const issuesResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/payment-issues?status=OPEN',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(issuesResponse.status, 200);
    const issuesBody = issuesResponse.json();
    assert.ok(issuesBody.data.some((issue) => issue.issue_type === 'INVOICE_OVERDUE'));

    const storedIssue = await paymentOpsIssueRepository.findByUniqueKey(
      'invoice',
      createdInvoice.internal_invoice_id,
      'INVOICE_OVERDUE'
    );
    assert.ok(storedIssue);
    assert.equal(storedIssue.status, 'OPEN');
  });

  test('admins can acknowledge, resolve, and reopen payment issues without losing acknowledgement state on sync', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Issue lifecycle invoice',
      dueDate: '2020-01-01T00:00:00.000Z',
      items: [
        {
          name: 'Support',
          description: 'Lifecycle support',
          quantity: 1,
          unitAmount: 75
        }
      ]
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(createResponse.status, 201);
    const createdInvoice = createResponse.json();

    const refreshResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/refresh`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(refreshResponse.status, 200);

    const issue = await paymentOpsIssueRepository.findByUniqueKey(
      'invoice',
      createdInvoice.internal_invoice_id,
      'INVOICE_OVERDUE'
    );
    assert.ok(issue);

    const acknowledgePayload = JSON.stringify({
      note: 'Ops team investigating customer follow-up.'
    });
    const acknowledgeResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payment-issues/${issue.id}/acknowledge`,
      headers: jsonHeaders(acknowledgePayload, bearerHeaders(adminToken)),
      body: acknowledgePayload
    });

    assert.equal(acknowledgeResponse.status, 200);
    assert.equal(acknowledgeResponse.json().issue.status, 'ACKNOWLEDGED');
    assert.equal(
      acknowledgeResponse.json().issue.acknowledgement.acknowledgement_note,
      'Ops team investigating customer follow-up.'
    );

    const secondRefreshResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/refresh`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(secondRefreshResponse.status, 200);

    const acknowledgedIssue = await paymentOpsIssueRepository.findById(issue.id);
    assert.equal(acknowledgedIssue.status, 'ACKNOWLEDGED');
    assert.equal(
      acknowledgedIssue.metadata.acknowledgement_note,
      'Ops team investigating customer follow-up.'
    );

    const resolvePayload = JSON.stringify({
      note: 'Customer contacted and manual retry scheduled.'
    });
    const resolveResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payment-issues/${issue.id}/resolve`,
      headers: jsonHeaders(resolvePayload, bearerHeaders(adminToken)),
      body: resolvePayload
    });

    assert.equal(resolveResponse.status, 200);
    assert.equal(resolveResponse.json().issue.status, 'RESOLVED');
    assert.equal(
      resolveResponse.json().issue.resolution.resolution_note,
      'Customer contacted and manual retry scheduled.'
    );

    const reopenPayload = JSON.stringify({
      note: 'Issue still active after follow-up.'
    });
    const reopenResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payment-issues/${issue.id}/reopen`,
      headers: jsonHeaders(reopenPayload, bearerHeaders(adminToken)),
      body: reopenPayload
    });

    assert.equal(reopenResponse.status, 200);
    assert.equal(reopenResponse.json().issue.status, 'OPEN');
    assert.equal(reopenResponse.json().issue.metadata.reopen_note, 'Issue still active after follow-up.');
  });

  test('POST /api/invoices/:id/refresh syncs the latest official PayPal invoice state', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Consulting retainer',
      items: [
        {
          name: 'Consulting',
          description: 'April retainer',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(createResponse.status, 201);
    const createdInvoice = createResponse.json();
    sandboxInvoices.get(createdInvoice.invoice_id).status = 'PAID';

    const refreshResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/refresh`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(refreshResponse.status, 200);
    const refreshedInvoice = refreshResponse.json();
    assert.equal(refreshedInvoice.status, 'PAID');
    assert.ok(refreshedInvoice.official_paypal.last_synced_at);

    const storedInvoice = await invoiceRepository.findById(createdInvoice.internal_invoice_id);
    assert.equal(storedInvoice.status, 'PAID');
    assert.ok(storedInvoice.paypalSyncedAt);
  });

  test('POST /api/invoices/:id/remind triggers the official PayPal reminder flow', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Consulting retainer',
      items: [
        {
          name: 'Consulting',
          description: 'April retainer',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(createResponse.status, 201);
    const createdInvoice = createResponse.json();

    const remindResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/remind`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(remindResponse.status, 200);
    const remindedInvoice = remindResponse.json();
    assert.equal(remindedInvoice.status, 'SENT');
    assert.ok(remindedInvoice.official_paypal.last_synced_at);
  });

  test('POST /api/invoices/:id/cancel-reminders records invoice-level PayPal reminder cancellation', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Reminder cancellation invoice',
      items: [
        {
          name: 'Consulting',
          description: 'Reminder cancellation item',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(createResponse.status, 201);
    const createdInvoice = createResponse.json();

    const cancelResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/cancel-reminders`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(cancelResponse.status, 200);
    const cancelledReminderInvoice = cancelResponse.json();
    assert.ok(cancelledReminderInvoice.summary.auto_reminders_cancelled_at);

    const storedInvoice = await invoiceRepository.findById(createdInvoice.internal_invoice_id);
    assert.ok(storedInvoice.autoRemindersCancelledAt);
  });

  test('POST /api/invoices/:id/qr stores the official PayPal invoice QR details', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Consulting retainer',
      items: [
        {
          name: 'Consulting',
          description: 'April retainer',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(createResponse.status, 201);
    const createdInvoice = createResponse.json();

    const qrResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/qr`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(qrResponse.status, 200);
    const qrInvoice = qrResponse.json();
    assert.equal(
      qrInvoice.official_paypal.qr.image_url_png,
      'https://www.sandbox.paypal.com/qr/PP-INV-001.png'
    );

    const storedInvoice = await invoiceRepository.findById(createdInvoice.internal_invoice_id);
    assert.equal(
      storedInvoice.paypalQrDetails.image_url_svg,
      'https://www.sandbox.paypal.com/qr/PP-INV-001.svg'
    );
  });

  test('POST /api/invoices/:id/cancel syncs the official PayPal cancelled state', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Cancelable invoice',
      items: [
        {
          name: 'Consulting',
          description: 'Cancelable invoice item',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(createResponse.status, 201);
    const createdInvoice = createResponse.json();

    const cancelResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/cancel`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(cancelResponse.status, 200);
    const cancelledInvoice = cancelResponse.json();
    assert.equal(cancelledInvoice.status, 'CANCELLED');
    assert.ok(cancelledInvoice.summary.cancelled_at);
    assert.ok(cancelledInvoice.official_paypal.last_synced_at);

    const storedInvoice = await invoiceRepository.findById(createdInvoice.internal_invoice_id);
    assert.equal(storedInvoice.status, 'CANCELLED');
    assert.ok(storedInvoice.cancelledAt);
  });

  test('GET /api/invoices/:id/timeline exposes official invoice audit activity', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Timeline invoice',
      items: [
        {
          name: 'Consulting',
          description: 'Timeline invoice item',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(createResponse.status, 201);
    const createdInvoice = createResponse.json();

    await injectRequest(app, {
      method: 'POST',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/remind`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    const timelineResponse = await injectRequest(app, {
      method: 'GET',
      url: `/api/invoices/${createdInvoice.internal_invoice_id}/timeline?limit=10`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(timelineResponse.status, 200);
    const timelineBody = timelineResponse.json();
    assert.ok(Array.isArray(timelineBody.data));
    assert.ok(timelineBody.data.some((entry) => entry.action === 'invoice.created'));
    assert.ok(timelineBody.data.some((entry) => entry.action === 'invoice.reminder_sent'));
  });

  test('auth register/login, points lookup, receipt generation, email dispatch, referral stats, and telegram webhook all work through the new SlipCraft endpoints', async () => {
    const registerPayload = JSON.stringify({
      email: 'slipcraft-user@example.com',
      password: 'strongpassword123',
      name: 'SlipCraft User',
      countryCode: 'US'
    });

    const registerResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/auth/register',
      headers: jsonHeaders(registerPayload),
      body: registerPayload
    });

    assert.equal(registerResponse.status, 201);
    const registerBody = registerResponse.json();
    assert.ok(registerBody.token);
    assert.equal(registerBody.user.email, 'slipcraft-user@example.com');
    assert.equal(registerBody.user.profile.points, 50);

    const loginPayload = JSON.stringify({
      email: 'slipcraft-user@example.com',
      password: 'strongpassword123'
    });

    const loginResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: jsonHeaders(loginPayload),
      body: loginPayload
    });

    assert.equal(loginResponse.status, 200);
    const loginBody = loginResponse.json();
    assert.ok(loginBody.token);
    assert.equal(loginBody.user.id, registerBody.user.id);

    const pointsResponse = await injectRequest(app, {
      method: 'GET',
      url: `/api/user/${registerBody.user.id}/points`,
      headers: bearerHeaders(loginBody.token)
    });

    assert.equal(pointsResponse.status, 200);
    assert.equal(pointsResponse.json().points, 50);

    const receiptPayload = JSON.stringify({
      type: 'bank',
      title: 'SlipCraft Demo Receipt',
      details: {
        merchant: 'SlipCraft Store',
        amount: '$19.99'
      }
    });

    const receiptResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/receipt/generate',
      headers: jsonHeaders(receiptPayload, bearerHeaders(loginBody.token)),
      body: receiptPayload
    });

    assert.equal(receiptResponse.status, 201);
    const receiptBody = receiptResponse.json();
    assert.ok(receiptBody.receipt.id);
    assert.match(receiptBody.pdf_data_url, /^data:application\/pdf;base64,/);
    assert.match(receiptBody.image_data_url, /^data:image\/svg\+xml;base64,/);
    assert.equal(receiptBody.summary.remaining_points, 40);

    const emailPayload = JSON.stringify({
      receiptId: receiptBody.receipt.id,
      toEmail: 'recipient@example.com'
    });

    const emailResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/email/send',
      headers: jsonHeaders(emailPayload, bearerHeaders(loginBody.token)),
      body: emailPayload
    });

    assert.equal(emailResponse.status, 201);
    const emailBody = emailResponse.json();
    assert.equal(emailBody.dispatch.status, 'LOCAL_ONLY');
    assert.equal(emailBody.receipt.status, 'EMAILED');

    const referralResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/referral',
      headers: jsonHeaders('{}', bearerHeaders(loginBody.token)),
      body: '{}'
    });

    assert.equal(referralResponse.status, 200);
    const referralBody = referralResponse.json();
    assert.equal(referralBody.referral_count, 0);
    assert.ok(referralBody.referral_code);

    await telegramRepository.upsertAccount({
      userId: registerBody.user.id,
      telegramUserId: 'tg-user-1',
      chatId: 'tg-chat-1',
      username: 'slipcraft_bot_user',
      firstName: 'Slip',
      lastName: 'Craft'
    });

    const telegramPayload = JSON.stringify({
      update_id: 1,
      message: {
        text: '/balance',
        chat: {
          id: 'tg-chat-1'
        },
        from: {
          id: 'tg-user-1',
          username: 'slipcraft_bot_user',
          first_name: 'Slip',
          last_name: 'Craft'
        }
      }
    });

    const telegramResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/telegram/webhook',
      headers: jsonHeaders(telegramPayload, {
        'x-telegram-bot-api-secret-token': ''
      }),
      body: telegramPayload
    });

    assert.equal(telegramResponse.status, 200);
    const telegramBody = telegramResponse.json();
    assert.equal(telegramBody.command, '/balance');
    assert.equal(telegramBody.response.data.points, 40);

    const receipt = await receiptRepository.findById(receiptBody.receipt.id);
    assert.equal(receipt.status, 'EMAILED');

    const profile = await profileRepository.findByUserId(registerBody.user.id);
    assert.equal(profile.points, 40);
  });

  test('user-scoped invoice access blocks cross-account reads and lists only owned records', async () => {
    const demoPayload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'demo-buyer@example.com',
      currency: 'USD',
      description: 'Demo invoice',
      items: [
        {
          name: 'Consulting',
          description: 'Demo user invoice',
          quantity: 1,
          unitAmount: 50
        }
      ]
    });

    const secondaryPayload = JSON.stringify({
      userId: 'secondary-user',
      recipientEmail: 'secondary-buyer@example.com',
      currency: 'USD',
      description: 'Secondary invoice',
      items: [
        {
          name: 'Support',
          description: 'Secondary user invoice',
          quantity: 1,
          unitAmount: 70
        }
      ]
    });

    const demoInvoiceResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(demoPayload, bearerHeaders(userTokens.demoUser)),
      body: demoPayload
    });

    const secondaryInvoiceResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(secondaryPayload, bearerHeaders(userTokens.secondaryUser)),
      body: secondaryPayload
    });

    assert.equal(demoInvoiceResponse.status, 201);
    assert.equal(secondaryInvoiceResponse.status, 201);

    const demoInvoice = demoInvoiceResponse.json();
    const secondaryInvoice = secondaryInvoiceResponse.json();

    const forbiddenGet = await injectRequest(app, {
      method: 'GET',
      url: `/api/invoices/${secondaryInvoice.internal_invoice_id}`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(forbiddenGet.status, 403);
    assert.equal(forbiddenGet.json().code, 'USER_SCOPE_VIOLATION');

    const demoList = await injectRequest(app, {
      method: 'GET',
      url: '/api/invoices',
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(demoList.status, 200);
    const listBody = demoList.json();
    assert.equal(listBody.data.length, 1);
    assert.equal(listBody.data[0].internal_invoice_id, demoInvoice.internal_invoice_id);
  });

  test('payout review and approval flow settles reserved funds after admin approval', async () => {
    const requestPayload = JSON.stringify({
      userId: 'demo-user',
      receiver: 'recipient@example.com',
      recipientType: 'EMAIL',
      receiverCountryCode: 'US',
      amount: 25,
      currency: 'USD',
      note: 'Weekly payout'
    });

    const requestResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/payouts',
      headers: jsonHeaders(requestPayload, bearerHeaders(userTokens.demoUser, {
        'idempotency-key': 'payout-review-1'
      })),
      body: requestPayload
    });

    assert.equal(requestResponse.status, 201);
    const requestBody = requestResponse.json();
    assert.equal(requestBody.status, 'PENDING_APPROVAL');
    assert.equal(requestBody.risk_decision, 'REVIEW');

    let user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.availableBalanceCents, 247500);
    assert.equal(user.wallet.frozenBalanceCents, 2500);

    const approvalResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payouts/${requestBody.payout_id}/approve`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(approvalResponse.status, 200);
    const approvalBody = approvalResponse.json();
    assert.equal(approvalBody.status, 'SUCCESS');
    assert.equal(approvalBody.tracking.payout_batch_id, 'PAYOUT-BATCH-123');
    assert.equal(approvalBody.tracking.payout_item_id, 'PAYOUT-ITEM-123');

    const payout = await payoutRepository.findById(requestBody.payout_id);
    assert.ok(payout);
    assert.equal(payout.status, 'SUCCESS');

    user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.availableBalanceCents, 247500);
    assert.equal(user.wallet.frozenBalanceCents, 0);
    assert.equal(user.wallet.paidOutBalanceCents, 2500);
  });

  test('payout policy enforces minimums, reserves fees, and flags manual review thresholds', async () => {
    await platformConfigRepository.update({
      payout_minimum_cents: 3000,
      payout_fee_fixed_cents: 150,
      payout_fee_percentage_bps: 100,
      payout_manual_review_cents: 2000
    });

    const belowMinimumPayload = JSON.stringify({
      userId: 'demo-user',
      receiver: 'threshold@example.com',
      recipientType: 'EMAIL',
      receiverCountryCode: 'US',
      amount: 25,
      currency: 'USD',
      note: 'Below minimum payout'
    });

    const belowMinimumResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/payouts',
      headers: jsonHeaders(belowMinimumPayload, bearerHeaders(userTokens.demoUser, {
        'idempotency-key': 'payout-policy-minimum-1'
      })),
      body: belowMinimumPayload
    });

    assert.equal(belowMinimumResponse.status, 409);
    assert.equal(belowMinimumResponse.json().code, 'PAYOUT_BELOW_MINIMUM');

    const requestPayload = JSON.stringify({
      userId: 'demo-user',
      receiver: 'threshold@example.com',
      recipientType: 'EMAIL',
      receiverCountryCode: 'US',
      amount: 35,
      currency: 'USD',
      note: 'Policy payout'
    });

    const requestResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/payouts',
      headers: jsonHeaders(requestPayload, bearerHeaders(userTokens.demoUser, {
        'idempotency-key': 'payout-policy-minimum-2'
      })),
      body: requestPayload
    });

    assert.equal(requestResponse.status, 201);
    const requestBody = requestResponse.json();
    assert.equal(requestBody.status, 'PENDING_APPROVAL');
    assert.equal(requestBody.risk_decision, 'REVIEW');

    let user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.availableBalanceCents, 246315);
    assert.equal(user.wallet.frozenBalanceCents, 3685);

    const payoutDetailResponse = await injectRequest(app, {
      method: 'GET',
      url: `/api/payouts/${requestBody.payout_id}`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(payoutDetailResponse.status, 200);
    const payoutBody = payoutDetailResponse.json();
    assert.equal(payoutBody.summary.amount, '35.00');
    assert.equal(payoutBody.summary.fee_amount, '1.85');
    assert.equal(payoutBody.summary.total_debit, '36.85');
    assert.equal(payoutBody.pricing.fee_amount, '1.85');
    assert.equal(payoutBody.pricing.total_debit, '36.85');
    assert.equal(payoutBody.pricing.fee_fixed_amount, '1.50');
    assert.equal(payoutBody.pricing.fee_percentage_bps, 100);

    const payoutFlags = await db.all('SELECT rule_code FROM risk_flags WHERE payout_id = ?', [requestBody.payout_id]);
    assert.ok(payoutFlags.some((flag) => flag.rule_code === 'PAYOUT_MANUAL_REVIEW_THRESHOLD'));

    const approvalResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payouts/${requestBody.payout_id}/approve`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(approvalResponse.status, 200);
    assert.equal(approvalResponse.json().status, 'SUCCESS');

    user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.availableBalanceCents, 246315);
    assert.equal(user.wallet.frozenBalanceCents, 0);
    assert.equal(user.wallet.paidOutBalanceCents, 3685);
  });

  test('POST /api/payouts/:id/refresh and GET /api/payouts/:id/timeline expose payout sync activity', async () => {
    const requestPayload = JSON.stringify({
      userId: 'demo-user',
      receiver: 'recipient@example.com',
      recipientType: 'EMAIL',
      receiverCountryCode: 'US',
      amount: 25,
      currency: 'USD',
      note: 'Refresh payout'
    });

    const requestResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/payouts',
      headers: jsonHeaders(requestPayload, bearerHeaders(userTokens.demoUser, {
        'idempotency-key': 'payout-refresh-1'
      })),
      body: requestPayload
    });

    assert.equal(requestResponse.status, 201);
    const requestBody = requestResponse.json();
    assert.equal(requestBody.status, 'PENDING_APPROVAL');

    const approvalResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payouts/${requestBody.payout_id}/approve`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(approvalResponse.status, 200);

    const refreshResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/payouts/${requestBody.payout_id}/refresh`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(refreshResponse.status, 200);
    const refreshedPayout = refreshResponse.json();
    assert.equal(refreshedPayout.status, 'SUCCESS');
    assert.equal(refreshedPayout.metadata.provider_item_status, 'SUCCESS');
    assert.ok(refreshedPayout.metadata.last_synced_at);

    const timelineResponse = await injectRequest(app, {
      method: 'GET',
      url: `/api/payouts/${requestBody.payout_id}/timeline?limit=10`,
      headers: bearerHeaders(userTokens.demoUser)
    });

    assert.equal(timelineResponse.status, 200);
    const timelineBody = timelineResponse.json();
    assert.ok(timelineBody.data.some((entry) => entry.action === 'payout.requested'));
    assert.ok(
      timelineBody.data.some((entry) =>
        entry.action === 'payout.refreshed' || entry.action === 'payout.processed'
      )
    );
  });

  test('admin can cancel an unclaimed PayPal payout item and restore funds to available balance', async () => {
    const requestPayload = JSON.stringify({
      userId: 'demo-user',
      receiver: 'unclaimed@example.com',
      recipientType: 'EMAIL',
      receiverCountryCode: 'US',
      amount: 25,
      currency: 'USD',
      note: 'Unclaimed payout'
    });

    const requestResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/payouts',
      headers: jsonHeaders(requestPayload, bearerHeaders(userTokens.demoUser, {
        'idempotency-key': 'payout-unclaimed-1'
      })),
      body: requestPayload
    });

    assert.equal(requestResponse.status, 201);
    const requestBody = requestResponse.json();
    assert.equal(requestBody.status, 'PENDING_APPROVAL');

    const approvalResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payouts/${requestBody.payout_id}/approve`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(approvalResponse.status, 200);
    assert.equal(approvalResponse.json().status, 'PENDING');
    assert.equal(approvalResponse.json().official_paypal.provider_item_status, 'UNCLAIMED');
    assert.equal(approvalResponse.json().official_paypal.remediation.action, 'cancel_unclaimed');

    let user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.availableBalanceCents, 247500);
    assert.equal(user.wallet.frozenBalanceCents, 2500);

    const cancelResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payouts/${requestBody.payout_id}/cancel-unclaimed`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(cancelResponse.status, 200);
    const cancelledPayout = cancelResponse.json();
    assert.equal(cancelledPayout.status, 'FAILED');
    assert.equal(cancelledPayout.official_paypal.provider_item_status, 'RETURNED');

    user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.availableBalanceCents, 250000);
    assert.equal(user.wallet.frozenBalanceCents, 0);
  });

  test('held payouts surface provider remediation guidance in admin listings', async () => {
    const requestPayload = JSON.stringify({
      userId: 'demo-user',
      receiver: 'held@example.com',
      recipientType: 'EMAIL',
      receiverCountryCode: 'US',
      amount: 25,
      currency: 'USD',
      note: 'Held payout'
    });

    const requestResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/payouts',
      headers: jsonHeaders(requestPayload, bearerHeaders(userTokens.demoUser, {
        'idempotency-key': 'payout-held-1'
      })),
      body: requestPayload
    });

    assert.equal(requestResponse.status, 201);
    const requestBody = requestResponse.json();

    const approvalResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payouts/${requestBody.payout_id}/approve`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(approvalResponse.status, 200);
    assert.equal(approvalResponse.json().status, 'PENDING');

    const adminListResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/payouts?status=PENDING',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(adminListResponse.status, 200);
    const heldPayout = adminListResponse.json().data.find((entry) => entry.payout_id === requestBody.payout_id);
    assert.ok(heldPayout);
    assert.equal(heldPayout.official_paypal.provider_item_status, 'ONHOLD');
    assert.equal(heldPayout.official_paypal.provider_issue_code, 'REGULATORY_PENDING');
    assert.equal(heldPayout.official_paypal.remediation.action, 'review_hold');
  });

  test('PayPal payout item webhooks trigger payout resync through official PayPal endpoints', async () => {
    const requestPayload = JSON.stringify({
      userId: 'demo-user',
      receiver: 'recipient@example.com',
      recipientType: 'EMAIL',
      receiverCountryCode: 'US',
      amount: 25,
      currency: 'USD',
      note: 'Webhook payout'
    });

    const requestResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/payouts',
      headers: jsonHeaders(requestPayload, bearerHeaders(userTokens.demoUser, {
        'idempotency-key': 'payout-webhook-1'
      })),
      body: requestPayload
    });

    assert.equal(requestResponse.status, 201);
    const requestBody = requestResponse.json();

    const approvalResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/payouts/${requestBody.payout_id}/approve`,
      headers: bearerHeaders(adminToken)
    });

    assert.equal(approvalResponse.status, 200);

    const webhookPayload = JSON.stringify({
      id: 'WH-PAYOUT-1',
      event_type: 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED',
      resource_type: 'payout_item',
      create_time: '2026-05-05T00:00:00Z',
      resource: {
        payout_item_id: 'PAYOUT-ITEM-123'
      }
    });

    const webhookHeaders = {
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-cert-url': 'https://api-m.sandbox.paypal.com/certs/test',
      'paypal-transmission-id': 'transmission-payout-1',
      'paypal-transmission-sig': 'signature-payout-1',
      'paypal-transmission-time': '2026-05-05T00:00:00Z'
    };

    const webhookResponse = await injectRequest(app, {
      method: 'POST',
      url: '/webhooks/paypal',
      headers: jsonHeaders(webhookPayload, webhookHeaders),
      body: webhookPayload
    });

    assert.equal(webhookResponse.status, 202);

    const payout = await payoutRepository.findById(requestBody.payout_id);
    assert.equal(payout.status, 'SUCCESS');
    assert.equal(payout.paypalPayoutItemId, 'PAYOUT-ITEM-123');
    assert.equal(payout.metadata.provider_item_status, 'SUCCESS');
  });

  test('admin invoice release moves paid funds from pending to available and is surfaced in admin listings', async () => {
    const invoice = await invoiceRepository.create({
      userId: 'demo-user',
      paypalInvoiceId: 'PP-INV-RELEASE-1',
      invoiceNumber: 'INV-RELEASE-1',
      status: 'SENT',
      amountCents: 9100,
      currencyCode: 'USD',
      recipientEmail: 'buyer@example.com',
      description: 'Release test invoice',
      invoiceUrl: 'https://www.sandbox.paypal.com/invoice/p/#PP-INV-RELEASE-1',
      paypalDetails: {},
      metadata: {}
    });

    const webhookPayload = JSON.stringify({
      id: 'WH-EVENT-RELEASE-1',
      event_type: 'INVOICING.INVOICE.PAID',
      resource_type: 'invoice',
      create_time: '2026-05-05T00:00:00Z',
      resource: {
        invoice_id: invoice.paypalInvoiceId
      }
    });

    const webhookHeaders = {
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-cert-url': 'https://api-m.sandbox.paypal.com/certs/test',
      'paypal-transmission-id': 'transmission-release-1',
      'paypal-transmission-sig': 'signature-release-1',
      'paypal-transmission-time': '2026-05-05T00:00:00Z'
    };

    const webhookResponse = await injectRequest(app, {
      method: 'POST',
      url: '/webhooks/paypal',
      headers: jsonHeaders(webhookPayload, webhookHeaders),
      body: webhookPayload
    });

    assert.equal(webhookResponse.status, 202);

    let user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.pendingBalanceCents, 9100);
    assert.equal(user.wallet.availableBalanceCents, 250000);

    const releasePayload = JSON.stringify({
      amount: 91,
      reason: 'Settlement window completed'
    });

    const releaseResponse = await injectRequest(app, {
      method: 'POST',
      url: `/api/admin/invoices/${invoice.id}/release`,
      headers: jsonHeaders(
        releasePayload,
        bearerHeaders(adminToken, {
          'idempotency-key': 'release-paid-invoice-1'
        })
      ),
      body: releasePayload
    });

    assert.equal(releaseResponse.status, 200);
    const releaseBody = releaseResponse.json();
    assert.equal(releaseBody.invoice_id, invoice.paypalInvoiceId);
    assert.equal(releaseBody.released_amount, '91.00');
    assert.equal(releaseBody.remaining_releasable_amount, '0.00');

    user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.pendingBalanceCents, 0);
    assert.equal(user.wallet.availableBalanceCents, 259100);

    const webhookListResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/webhooks?status=PROCESSED',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(webhookListResponse.status, 200);
    const webhookList = webhookListResponse.json();
    assert.equal(webhookList.data.length, 1);
    assert.equal(webhookList.data[0].event_id, 'WH-EVENT-RELEASE-1');
  });

  test('admin operations endpoints expose payouts, risk flags, and webhook events for review queues', async () => {
    const invoicePayload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Crypto settlement invoice',
      items: [
        {
          name: 'Advisory',
          description: 'Crypto treasury planning',
          quantity: 1,
          unitAmount: 40
        }
      ]
    });

    const invoiceResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(invoicePayload, bearerHeaders(userTokens.demoUser)),
      body: invoicePayload
    });

    assert.equal(invoiceResponse.status, 201);

    const payoutPayload = JSON.stringify({
      userId: 'demo-user',
      receiver: 'review@example.com',
      recipientType: 'EMAIL',
      receiverCountryCode: 'US',
      amount: 25,
      currency: 'USD',
      note: 'Operations review payout'
    });

    const payoutResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/payouts',
      headers: jsonHeaders(
        payoutPayload,
        bearerHeaders(userTokens.demoUser, {
          'idempotency-key': 'payout-admin-list-1'
        })
      ),
      body: payoutPayload
    });

    assert.equal(payoutResponse.status, 201);
    assert.equal(payoutResponse.json().status, 'PENDING_APPROVAL');

    const payoutListResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/payouts?status=PENDING_APPROVAL',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(payoutListResponse.status, 200);
    const payoutList = payoutListResponse.json();
    assert.equal(payoutList.data.length, 1);
    assert.equal(payoutList.data[0].status, 'PENDING_APPROVAL');

    const riskFlagsResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/risk-flags?severity=MEDIUM',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(riskFlagsResponse.status, 200);
    const riskFlagsBody = riskFlagsResponse.json();
    assert.ok(riskFlagsBody.data.length >= 2);
    assert.ok(
      riskFlagsBody.data.some((flag) => flag.rule_code === 'SUSPICIOUS_INVOICE_DESCRIPTION')
    );
    assert.ok(riskFlagsBody.data.some((flag) => flag.rule_code === 'NEW_RECIPIENT_HOLD'));
  });

  test('admin ops endpoints expose queue health and dead-letter jobs', async () => {
    opsService.getQueueOverview = async () => ({
      generated_at: '2026-05-05T00:00:00.000Z',
      redis_status: 'ready',
      queues: [
        {
          key: 'payout_process',
          name: 'payout-process',
          counts: {
            waiting: 1,
            active: 0,
            completed: 4,
            failed: 0,
            delayed: 2,
            paused: 0
          }
        }
      ]
    });

    opsService.listDeadLetterJobs = async () => [
      {
        job_id: '17',
        name: 'payout-process-dead-letter',
        attempts_made: 5,
        failed_reason: 'Provider timeout',
        queue_name: 'dead-letter',
        data: {
          queueName: 'payout-process',
          payload: {
            payoutId: 'payout-1'
          }
        },
        created_at: '2026-05-05T00:00:00.000Z',
        finished_at: '2026-05-05T00:01:00.000Z'
      }
    ];

    const queueResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/queues',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(queueResponse.status, 200);
    const queueBody = queueResponse.json();
    assert.equal(queueBody.redis_status, 'ready');
    assert.equal(queueBody.queues.length, 1);
    assert.equal(queueBody.queues[0].name, 'payout-process');
    assert.equal(queueBody.queues[0].counts.delayed, 2);

    const deadLetterResponse = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/dead-letters?limit=10',
      headers: bearerHeaders(adminToken)
    });

    assert.equal(deadLetterResponse.status, 200);
    const deadLetterBody = deadLetterResponse.json();
    assert.equal(deadLetterBody.data.length, 1);
    assert.equal(deadLetterBody.data[0].job_id, '17');
    assert.equal(deadLetterBody.data[0].queue_name, 'dead-letter');

    opsService.getQueueOverview = originalGetQueueOverview;
    opsService.listDeadLetterJobs = originalListDeadLetterJobs;
  });

  test('admin reconciliation trigger refreshes reconcilable invoice state through official PayPal sync', async () => {
    const payload = JSON.stringify({
      userId: 'demo-user',
      recipientEmail: 'buyer@example.com',
      currency: 'USD',
      description: 'Reconcilable invoice',
      items: [
        {
          name: 'Consulting',
          description: 'Reconciliation invoice',
          quantity: 1,
          unitAmount: 125
        }
      ]
    });

    const createResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/invoices',
      headers: jsonHeaders(payload, bearerHeaders(userTokens.demoUser)),
      body: payload
    });

    assert.equal(createResponse.status, 201);
    const createdInvoice = createResponse.json();
    sandboxInvoices.get(createdInvoice.invoice_id).status = 'PAID';

    const reconcileResponse = await injectRequest(app, {
      method: 'POST',
      url: '/api/admin/reconciliation/run',
      headers: jsonHeaders('{}', bearerHeaders(adminToken)),
      body: '{}'
    });

    assert.equal(reconcileResponse.status, 200);
    const reconcileBody = reconcileResponse.json();
    assert.equal(reconcileBody.summary.invoice_count, 1);
    assert.equal(reconcileBody.summary.payout_count, 0);
    assert.equal(reconcileBody.invoices[0].status, 'PAID');
  });

  test('PayPal invoice paid webhook is idempotent for duplicate event ids', async () => {
    const invoice = await invoiceRepository.create({
      userId: 'demo-user',
      paypalInvoiceId: 'PP-INV-PAID-1',
      invoiceNumber: 'INV-PAID-1',
      status: 'SENT',
      amountCents: 8800,
      currencyCode: 'USD',
      recipientEmail: 'buyer@example.com',
      description: 'Paid invoice test',
      invoiceUrl: 'https://www.sandbox.paypal.com/invoice/p/#PP-INV-PAID-1',
      paypalDetails: {},
      metadata: {}
    });

    const webhookPayload = {
      id: 'WH-EVENT-1',
      event_type: 'INVOICING.INVOICE.PAID',
      resource_type: 'invoice',
      create_time: '2026-05-05T00:00:00Z',
      resource: {
        invoice_id: invoice.paypalInvoiceId
      }
    };

    const headers = {
      'content-type': 'application/json',
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-cert-url': 'https://api-m.sandbox.paypal.com/certs/test',
      'paypal-transmission-id': 'transmission-1',
      'paypal-transmission-sig': 'signature-1',
      'paypal-transmission-time': '2026-05-05T00:00:00Z'
    };

    const firstPayload = JSON.stringify(webhookPayload);

    const firstResponse = await injectRequest(app, {
      method: 'POST',
      url: '/webhooks/paypal',
      headers: jsonHeaders(firstPayload, headers),
      body: firstPayload
    });

    assert.equal(firstResponse.status, 202);
    const firstBody = firstResponse.json();
    assert.equal(firstBody.duplicate, false);

    let user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.pendingBalanceCents, 8800);

    const duplicateResponse = await injectRequest(app, {
      method: 'POST',
      url: '/webhooks/paypal',
      headers: jsonHeaders(firstPayload, headers),
      body: firstPayload
    });

    assert.equal(duplicateResponse.status, 200);
    const duplicateBody = duplicateResponse.json();
    assert.equal(duplicateBody.duplicate, true);

    const webhookEvent = await webhookEventRepository.findByEventId('WH-EVENT-1');
    assert.ok(webhookEvent);
    assert.equal(webhookEvent.status, 'PROCESSED');

    const updatedInvoice = await invoiceRepository.findById(invoice.id);
    assert.equal(updatedInvoice.status, 'PAID');

    user = await userRepository.findById('demo-user');
    assert.equal(user.wallet.pendingBalanceCents, 8800);
  });

  test('admin routes require an admin bearer token when admin auth is configured', async () => {
    const response = await injectRequest(app, {
      method: 'GET',
      url: '/api/admin/payouts'
    });

    assert.equal(response.status, 401);
    assert.equal(response.json().code, 'ADMIN_AUTH_REQUIRED');
  });
});
