const { dispatchInvoiceCreation } = require('../jobs/dispatchers');
const {
  assertCanAccessUserResource,
  resolveUserIdForRequest
} = require('../middleware/authenticateRequest');
const { presentInvoice, presentPaymentTimelineEntry } = require('../presenters/paymentPresenter');
const { invoiceRepository } = require('../repositories/invoiceRepository');
const { createInvoiceSchema } = require('../schemas/invoiceSchemas');
const { paypalInvoiceService } = require('../services/paypalInvoiceService');
const { paymentTimelineService } = require('../services/paymentTimelineService');
const { paymentTimelineQuerySchema } = require('../schemas/payoutSchemas');
const { AUDIT_ACTOR_TYPE } = require('../utils/constants');

async function loadAccessibleInvoice(request, response, invoiceId) {
  const invoice = await invoiceRepository.findByIdentifier(invoiceId);
  if (!invoice) {
    response.status(404).json({
      code: 'INVOICE_NOT_FOUND',
      message: 'Invoice not found.'
    });
    return null;
  }

  assertCanAccessUserResource(request, invoice.userId);
  return invoice;
}

function resolveAuditActorType(request) {
  return request.auth && request.auth.role === 'ADMIN' ? AUDIT_ACTOR_TYPE.ADMIN : AUDIT_ACTOR_TYPE.USER;
}

function resolveAuditActorId(request) {
  return (request.auth && (request.auth.actorId || request.auth.userId)) || null;
}

async function createInvoiceController(request, response) {
  const body = createInvoiceSchema.parse(request.body);
  const result = await dispatchInvoiceCreation({
    ...body,
    userId: resolveUserIdForRequest(request, body.userId),
    requestId: request.id
  });
  response.status(201).json(result);
}

async function getInvoiceController(request, response) {
  const invoice = await loadAccessibleInvoice(request, response, request.params.id);
  if (!invoice) {
    return;
  }

  response.json(presentInvoice(invoice));
}

async function listInvoicesController(request, response) {
  const userId = request.auth && request.auth.role === 'USER' ? request.auth.userId : undefined;
  const invoices = await invoiceRepository.findMany(userId ? { userId } : {});
  response.json({
    data: invoices.map(presentInvoice)
  });
}

async function refreshInvoiceController(request, response) {
  const invoice = await loadAccessibleInvoice(request, response, request.params.id);
  if (!invoice) {
    return;
  }

  const result = await paypalInvoiceService.refreshInvoice({
    invoiceId: invoice.id,
    actorType: resolveAuditActorType(request),
    actorId: resolveAuditActorId(request)
  });
  response.json(result);
}

async function sendInvoiceReminderController(request, response) {
  const invoice = await loadAccessibleInvoice(request, response, request.params.id);
  if (!invoice) {
    return;
  }

  const result = await paypalInvoiceService.sendInvoiceReminder({
    invoiceId: invoice.id,
    actorType: resolveAuditActorType(request),
    actorId: resolveAuditActorId(request)
  });
  response.json(result);
}

async function cancelInvoiceAutoRemindersController(request, response) {
  const invoice = await loadAccessibleInvoice(request, response, request.params.id);
  if (!invoice) {
    return;
  }

  const result = await paypalInvoiceService.cancelInvoiceAutoReminders({
    invoiceId: invoice.id,
    actorType: resolveAuditActorType(request),
    actorId: resolveAuditActorId(request)
  });
  response.json(result);
}

async function generateInvoiceQrController(request, response) {
  const invoice = await loadAccessibleInvoice(request, response, request.params.id);
  if (!invoice) {
    return;
  }

  const result = await paypalInvoiceService.generateInvoiceQr({
    invoiceId: invoice.id,
    actorType: resolveAuditActorType(request),
    actorId: resolveAuditActorId(request)
  });
  response.json(result);
}

async function cancelInvoiceController(request, response) {
  const invoice = await loadAccessibleInvoice(request, response, request.params.id);
  if (!invoice) {
    return;
  }

  const result = await paypalInvoiceService.cancelInvoice({
    invoiceId: invoice.id,
    actorType: resolveAuditActorType(request),
    actorId: resolveAuditActorId(request)
  });
  response.json(result);
}

async function getInvoiceTimelineController(request, response) {
  const invoice = await loadAccessibleInvoice(request, response, request.params.id);
  if (!invoice) {
    return;
  }

  const query = paymentTimelineQuerySchema.parse(request.query || {});
  const entries = await paymentTimelineService.getTimeline('invoice', invoice.id, query);
  response.json({
    data: entries.map(presentPaymentTimelineEntry)
  });
}

module.exports = {
  createInvoiceController,
  getInvoiceController,
  listInvoicesController,
  refreshInvoiceController,
  sendInvoiceReminderController,
  cancelInvoiceAutoRemindersController,
  generateInvoiceQrController,
  cancelInvoiceController,
  getInvoiceTimelineController
};
