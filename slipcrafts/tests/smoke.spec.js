import { expect, test } from '@playwright/test';

const adminUser = {
  id: 'admin-user',
  email: 'admin@transferly.test',
  displayName: 'Admin Operator',
  isAdmin: true
};

const adminProfile = {
  id: 'admin-user',
  name: 'Admin Operator',
  is_admin: true,
  points: 5000,
  wallet: {
    currencyCode: 'USD',
    availableBalanceCents: 125000,
    pendingBalanceCents: 18000,
    frozenBalanceCents: 5000,
    paidOutBalanceCents: 74000
  }
};

const invoiceRecord = {
  internal_invoice_id: 'inv_internal_1001',
  invoice_id: 'PAYPAL-INV-1001',
  provider: 'paypal',
  status: 'SENT',
  summary: {
    invoice_number: 'INV-1001',
    recipient_email: 'buyer@example.com',
    amount: '150.00',
    currency: 'USD',
    issue_date: '2026-05-10',
    due_date: '2026-05-17',
    auto_reminders_cancelled_at: null
  },
  official_paypal: {
    last_synced_at: '2026-05-10T12:00:00.000Z',
    qr: {
      image_url_png: 'https://example.test/invoice-qr.png'
    }
  },
  metadata: {}
};

const payoutRecord = {
  payout_id: 'payout_1001',
  provider: 'paypal',
  status: 'PENDING_APPROVAL',
  risk_decision: 'REVIEW',
  summary: {
    receiver: 'recipient@example.com',
    recipient_type: 'EMAIL',
    amount: '75.00',
    currency: 'USD',
    total_debit: '76.25'
  },
  pricing: {
    fee: '1.25'
  },
  tracking: {
    sender_batch_id: 'batch_1001',
    payout_batch_id: 'paypal_batch_1001',
    payout_item_id: 'paypal_item_1001'
  },
  official_paypal: {
    provider_item_status: 'PENDING',
    provider_batch_status: 'PROCESSING',
    last_synced_at: '2026-05-10T12:00:00.000Z',
    remediation: {
      reason: 'Manual review required before provider submission.'
    }
  },
  metadata: {}
};

async function mockTransferlyApi(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('transferly_api_token', 'test-user-token');
    window.localStorage.setItem('transferly_admin_api_token', 'test-admin-token');
  });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    const json = (payload) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload)
      });

    if (path === '/api/bootstrap') {
      await json({
        platform: {
          platform_name: 'Transferly',
          brand_color: '#f8812d',
          bank_slip_cost: 10,
          email_receipt_cost: 5
        },
        faqs: [],
        testimonials: []
      });
      return;
    }

    if (path === '/api/me') {
      await json({
        user: adminUser,
        profile: adminProfile,
        points: { balance: 5000 },
        referrals: {},
        receipts: [],
        topUpOrders: []
      });
      return;
    }

    if (path === '/api/admin/users') {
      await json({ data: [adminUser] });
      return;
    }

    if (path === '/api/admin/invoices' || path === '/api/invoices') {
      await json({
        data: [invoiceRecord],
        pagination: { page: 1, page_size: 50, total: 1, has_next_page: false }
      });
      return;
    }

    if (path === '/api/admin/payouts' || path === '/api/payouts') {
      await json({
        data: [payoutRecord],
        pagination: { page: 1, page_size: 50, total: 1, has_next_page: false }
      });
      return;
    }

    if (path === '/api/admin/invoice-reminders') {
      await json({ data: [] });
      return;
    }

    if (path === '/api/admin/invoice-templates') {
      await json({
        data: [
          {
            id: 'template_1001',
            name: 'Standard Service Invoice',
            currency_code: 'USD',
            default_due_days: 7,
            is_active: true,
            line_items: [{ name: 'Service', quantity: 1, unitAmount: 150 }]
          }
        ]
      });
      return;
    }

    if (path === '/api/admin/payment-issues') {
      await json({ data: [] });
      return;
    }

    if (path === '/api/admin/top-up-orders') {
      await json({ data: [] });
      return;
    }

    if (path === '/api/admin/payment-providers') {
      await json({ data: [{ key: 'paypal', status: 'ready' }] });
      return;
    }

    if (path === '/api/admin/payment-providers/invoice-features') {
      await json({ data: [] });
      return;
    }

    await json({ data: [] });
  });
}

test('home page renders the primary Transferly launch surface', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Transferly/i);
  await expect(
    page.getByRole('heading', { name: 'The All-in-One Digital Services Platform' })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get Started Free' })).toBeVisible();
  await expect(page.getByText('Supported Platforms')).toBeVisible();
});

test('admin payments workspace loads and opens an invoice detail drawer', async ({ page }) => {
  await mockTransferlyApi(page);
  await page.goto('/admin?tab=payments&section=invoices');

  await expect(page.getByRole('heading', { name: 'PayPal Operations' })).toBeVisible();
  await expect(page.getByText('INV-1001', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Details' }).first().click();

  await expect(page.getByText('Invoice Detail')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'INV-1001' })).toBeVisible();
});

test('PayPal invoice launcher renders the embedded invoice composer', async ({ page }) => {
  await mockTransferlyApi(page);
  await page.goto('/services/paypal?view=invoices');

  await expect(page.getByRole('heading', { name: 'PayPal Invoicing', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quick Create Official Invoice' })).toBeVisible();
  await expect(page.getByLabel('Invoice template')).toContainText('Standard Service Invoice');
});

test('PayPal payout launcher renders the sandbox-style workspace', async ({ page }) => {
  await mockTransferlyApi(page);
  await page.goto('/services/paypal?view=payouts');

  await expect(page.getByText('PayPal').first()).toBeVisible();
  await expect(page.getByText('Available balance')).toBeVisible();
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Send money from your PayPal balance.')).toBeVisible();
  await page.getByRole('button', { name: 'Activity' }).click();
  await expect(page.getByText('payout_1001')).toBeVisible();
});
