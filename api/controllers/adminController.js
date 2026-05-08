const { dispatchPaymentReconciliation, dispatchPayoutProcessing } = require('../jobs/dispatchers');
const {
  adminAdjustUserPointsSchema,
  adminConfigUpdateSchema,
  adminFaqCreateSchema,
  adminFaqParamsSchema,
  adminFaqUpdateSchema,
  adminInvoiceTemplateCreateSchema,
  adminInvoiceReminderParamsSchema,
  adminInvoiceReminderUpdateSchema,
  adminInvoiceTemplateParamsSchema,
  adminInvoiceTemplateUpdateSchema,
  adminTestimonialCreateSchema,
  adminTestimonialParamsSchema,
  adminTestimonialUpdateSchema,
  adminUserIdParamsSchema,
  listPaymentOpsIssuesQuerySchema,
  listInvoiceReminderConfigurationsQuerySchema,
  listAdminPayoutsQuerySchema,
  listTopUpOrdersQuerySchema,
  listDeadLetterJobsQuerySchema,
  listRiskFlagsQuerySchema,
  listWebhookEventsQuerySchema,
  paymentOpsIssueActionSchema,
  paymentOpsIssueParamsSchema,
  releaseInvoiceFundsSchema,
  runPaymentReconciliationSchema,
  topUpOrderAdminActionSchema,
  topUpOrderParamsSchema
} = require('../schemas/adminSchemas');
const {
  presentAdminPayout,
  presentAdminUser,
  presentDeadLetterJob,
  presentFundRelease,
  presentInvoiceReminderConfiguration,
  presentInvoiceTemplate,
  presentPaymentOpsIssue,
  presentQueueOverview,
  presentRiskFlag,
  presentWebhookEvent
} = require('../presenters/adminPresenter');
const { payoutRepository } = require('../repositories/payoutRepository');
const { riskFlagRepository } = require('../repositories/riskFlagRepository');
const { webhookEventRepository } = require('../repositories/webhookEventRepository');
const { payoutParamsSchema, rejectPayoutSchema } = require('../schemas/payoutSchemas');
const { adminContentService } = require('../services/adminContentService');
const { opsService } = require('../services/opsService');
const { paypalInvoiceService } = require('../services/paypalInvoiceService');
const { invoiceTemplateService } = require('../services/invoiceTemplateService');
const { paymentOpsIssueService } = require('../services/paymentOpsIssueService');
const { paypalPayoutService } = require('../services/paypalPayoutService');
const { slipcraftUserService } = require('../services/slipcraftUserService');
const { topUpOrderService } = require('../services/topUpOrderService');
const { AUDIT_ACTOR_TYPE } = require('../utils/constants');

async function approvePayoutController(request, response) {
  const approval = await paypalPayoutService.approvePayout(request.params.id, request.adminActorId);
  const result = await dispatchPayoutProcessing(
    approval.payout_id,
    'process-approved-payout',
    `process-approved-payout:${approval.payout_id}`
  );
  response.json(result);
}

async function rejectPayoutController(request, response) {
  const body = rejectPayoutSchema.parse(request.body || {});
  const result = await paypalPayoutService.rejectPayout(request.params.id, request.adminActorId, body.reason);
  response.json(result);
}

async function cancelUnclaimedPayoutController(request, response) {
  const params = payoutParamsSchema.parse(request.params || {});
  const result = await paypalPayoutService.cancelUnclaimedPayout({
    payoutId: params.id,
    actorType: AUDIT_ACTOR_TYPE.ADMIN,
    actorId: request.adminActorId
  });
  response.json(result);
}

async function releaseInvoiceFundsController(request, response) {
  const body = releaseInvoiceFundsSchema.parse(request.body || {});
  const result = await paypalInvoiceService.releaseInvoiceFunds({
    invoiceId: request.params.id,
    amount: body.amount,
    reason: body.reason,
    idempotencyKey: request.idempotencyKey,
    adminActorId: request.adminActorId,
    requestId: request.id
  });

  response.json(presentFundRelease(result));
}

async function listAdminPayoutsController(request, response) {
  const query = listAdminPayoutsQuerySchema.parse(request.query || {});
  const payouts = await payoutRepository.findMany(query);
  response.json({
    data: payouts.map(presentAdminPayout)
  });
}

async function listRiskFlagsController(request, response) {
  const query = listRiskFlagsQuerySchema.parse(request.query || {});
  const flags = await riskFlagRepository.findMany(query);
  response.json({
    data: flags.map(presentRiskFlag)
  });
}

async function listWebhookEventsController(request, response) {
  const query = listWebhookEventsQuerySchema.parse(request.query || {});
  const events = await webhookEventRepository.findMany(query);
  response.json({
    data: events.map(presentWebhookEvent)
  });
}

async function listPaymentOpsIssuesController(request, response) {
  const query = listPaymentOpsIssuesQuerySchema.parse(request.query || {});
  const issues = await paymentOpsIssueService.listIssues(query);
  response.json({
    data: issues.map(presentPaymentOpsIssue)
  });
}

async function acknowledgePaymentOpsIssueController(request, response) {
  const params = paymentOpsIssueParamsSchema.parse(request.params || {});
  const body = paymentOpsIssueActionSchema.parse(request.body || {});
  const issue = await paymentOpsIssueService.acknowledgeIssue({
    issueId: params.id,
    adminActorId: request.adminActorId,
    note: body.note
  });
  response.json({ issue: presentPaymentOpsIssue(issue) });
}

async function resolvePaymentOpsIssueController(request, response) {
  const params = paymentOpsIssueParamsSchema.parse(request.params || {});
  const body = paymentOpsIssueActionSchema.parse(request.body || {});
  const issue = await paymentOpsIssueService.resolveIssue({
    issueId: params.id,
    adminActorId: request.adminActorId,
    note: body.note
  });
  response.json({ issue: presentPaymentOpsIssue(issue) });
}

async function reopenPaymentOpsIssueController(request, response) {
  const params = paymentOpsIssueParamsSchema.parse(request.params || {});
  const body = paymentOpsIssueActionSchema.parse(request.body || {});
  const issue = await paymentOpsIssueService.reopenIssue({
    issueId: params.id,
    adminActorId: request.adminActorId,
    note: body.note
  });
  response.json({ issue: presentPaymentOpsIssue(issue) });
}

async function getQueueOverviewController(_request, response) {
  const overview = await opsService.getQueueOverview();
  response.json(presentQueueOverview(overview));
}

async function listDeadLetterJobsController(request, response) {
  const query = listDeadLetterJobsQuerySchema.parse(request.query || {});
  const jobs = await opsService.listDeadLetterJobs(query.limit);
  response.json({
    data: jobs.map(presentDeadLetterJob)
  });
}

async function runPaymentReconciliationController(request, response) {
  const input = runPaymentReconciliationSchema.parse(request.body || {});
  const result = await dispatchPaymentReconciliation(input);
  response.json(result);
}

async function listAdminUsersController(_request, response) {
  const users = await slipcraftUserService.listUsers();
  response.json({
    data: users.map(presentAdminUser)
  });
}

async function listTopUpOrdersController(request, response) {
  const query = listTopUpOrdersQuerySchema.parse(request.query || {});
  const orders = await topUpOrderService.listOrders(query);
  response.json({ data: orders });
}

async function completeTopUpOrderController(request, response) {
  const params = topUpOrderParamsSchema.parse(request.params || {});
  const body = topUpOrderAdminActionSchema.parse(request.body || {});
  const order = await topUpOrderService.completeOrder({
    orderId: params.id,
    adminActorId: request.adminActorId,
    notes: body.notes
  });
  response.json({ order });
}

async function cancelTopUpOrderController(request, response) {
  const params = topUpOrderParamsSchema.parse(request.params || {});
  const body = topUpOrderAdminActionSchema.parse(request.body || {});
  const order = await topUpOrderService.cancelOrder({
    orderId: params.id,
    adminActorId: request.adminActorId,
    notes: body.notes
  });
  response.json({ order });
}

async function adjustAdminUserPointsController(request, response) {
  const params = adminUserIdParamsSchema.parse(request.params || {});
  const body = adminAdjustUserPointsSchema.parse(request.body || {});
  const user = await slipcraftUserService.adjustUserPoints({
    targetUserId: params.id,
    delta: body.delta,
    reason: body.reason,
    adminActorId: request.adminActorId
  });

  response.json({ user: presentAdminUser(user) });
}

async function updateAdminConfigController(request, response) {
  const updates = adminConfigUpdateSchema.parse(request.body || {});
  const config = await adminContentService.updateConfig({
    updates,
    adminActorId: request.adminActorId
  });

  response.json({ config });
}

async function createAdminFaqController(request, response) {
  const input = adminFaqCreateSchema.parse(request.body || {});
  const faq = await adminContentService.createFaq({
    input,
    adminActorId: request.adminActorId
  });

  response.status(201).json({ faq });
}

async function updateAdminFaqController(request, response) {
  const params = adminFaqParamsSchema.parse(request.params || {});
  const updates = adminFaqUpdateSchema.parse(request.body || {});
  const faq = await adminContentService.updateFaq({
    id: params.id,
    updates,
    adminActorId: request.adminActorId
  });

  response.json({ faq });
}

async function deleteAdminFaqController(request, response) {
  const params = adminFaqParamsSchema.parse(request.params || {});
  const result = await adminContentService.deleteFaq({
    id: params.id,
    adminActorId: request.adminActorId
  });

  response.json(result);
}

async function createAdminTestimonialController(request, response) {
  const input = adminTestimonialCreateSchema.parse(request.body || {});
  const testimonial = await adminContentService.createTestimonial({
    input,
    adminActorId: request.adminActorId
  });

  response.status(201).json({ testimonial });
}

async function updateAdminTestimonialController(request, response) {
  const params = adminTestimonialParamsSchema.parse(request.params || {});
  const updates = adminTestimonialUpdateSchema.parse(request.body || {});
  const testimonial = await adminContentService.updateTestimonial({
    id: params.id,
    updates,
    adminActorId: request.adminActorId
  });

  response.json({ testimonial });
}

async function deleteAdminTestimonialController(request, response) {
  const params = adminTestimonialParamsSchema.parse(request.params || {});
  const result = await adminContentService.deleteTestimonial({
    id: params.id,
    adminActorId: request.adminActorId
  });

  response.json(result);
}

async function listAdminInvoiceTemplatesController(_request, response) {
  const templates = await invoiceTemplateService.listTemplates();
  response.json({ data: templates.map(presentInvoiceTemplate) });
}

async function listInvoiceReminderConfigurationsController(request, response) {
  const query = listInvoiceReminderConfigurationsQuerySchema.parse(request.query || {});
  const result = await paypalInvoiceService.listReminderConfigurations(query);
  response.json({
    data: result.data.map(presentInvoiceReminderConfiguration)
  });
}

async function updateInvoiceReminderConfigurationController(request, response) {
  const params = adminInvoiceReminderParamsSchema.parse(request.params || {});
  const input = adminInvoiceReminderUpdateSchema.parse(request.body || {});
  const configuration = await paypalInvoiceService.updateReminderConfiguration({
    configurationId: params.id,
    ...input,
    actorType: AUDIT_ACTOR_TYPE.ADMIN,
    actorId: request.adminActorId
  });

  response.json({ configuration: presentInvoiceReminderConfiguration(configuration) });
}

async function suspendInvoiceReminderConfigurationController(request, response) {
  const params = adminInvoiceReminderParamsSchema.parse(request.params || {});
  const configuration = await paypalInvoiceService.suspendReminderConfiguration({
    configurationId: params.id,
    actorType: AUDIT_ACTOR_TYPE.ADMIN,
    actorId: request.adminActorId
  });

  response.json({ configuration: presentInvoiceReminderConfiguration(configuration) });
}

async function resumeInvoiceReminderConfigurationController(request, response) {
  const params = adminInvoiceReminderParamsSchema.parse(request.params || {});
  const configuration = await paypalInvoiceService.resumeReminderConfiguration({
    configurationId: params.id,
    actorType: AUDIT_ACTOR_TYPE.ADMIN,
    actorId: request.adminActorId
  });

  response.json({ configuration: presentInvoiceReminderConfiguration(configuration) });
}

async function createAdminInvoiceTemplateController(request, response) {
  const input = adminInvoiceTemplateCreateSchema.parse(request.body || {});
  const template = await invoiceTemplateService.createTemplate({
    input,
    adminActorId: request.adminActorId
  });

  response.status(201).json({ template: presentInvoiceTemplate(template) });
}

async function updateAdminInvoiceTemplateController(request, response) {
  const params = adminInvoiceTemplateParamsSchema.parse(request.params || {});
  const updates = adminInvoiceTemplateUpdateSchema.parse(request.body || {});
  const template = await invoiceTemplateService.updateTemplate({
    id: params.id,
    updates,
    adminActorId: request.adminActorId
  });

  response.json({ template: presentInvoiceTemplate(template) });
}

async function deleteAdminInvoiceTemplateController(request, response) {
  const params = adminInvoiceTemplateParamsSchema.parse(request.params || {});
  const result = await invoiceTemplateService.deleteTemplate({
    id: params.id,
    adminActorId: request.adminActorId
  });

  response.json(result);
}

module.exports = {
  acknowledgePaymentOpsIssueController,
  adjustAdminUserPointsController,
  approvePayoutController,
  cancelTopUpOrderController,
  cancelUnclaimedPayoutController,
  completeTopUpOrderController,
  createAdminFaqController,
  listInvoiceReminderConfigurationsController,
  updateInvoiceReminderConfigurationController,
  suspendInvoiceReminderConfigurationController,
  resumeInvoiceReminderConfigurationController,
  createAdminInvoiceTemplateController,
  createAdminTestimonialController,
  deleteAdminFaqController,
  deleteAdminInvoiceTemplateController,
  deleteAdminTestimonialController,
  rejectPayoutController,
  releaseInvoiceFundsController,
  listAdminUsersController,
  listTopUpOrdersController,
  listAdminInvoiceTemplatesController,
  listAdminPayoutsController,
  listPaymentOpsIssuesController,
  listRiskFlagsController,
  listWebhookEventsController,
  reopenPaymentOpsIssueController,
  resolvePaymentOpsIssueController,
  getQueueOverviewController,
  listDeadLetterJobsController,
  runPaymentReconciliationController,
  updateAdminConfigController,
  updateAdminFaqController,
  updateAdminInvoiceTemplateController,
  updateAdminTestimonialController
};
