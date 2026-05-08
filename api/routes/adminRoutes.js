const express = require('express');

const {
  adjustAdminUserPointsController,
  acknowledgePaymentOpsIssueController,
  approvePayoutController,
  cancelUnclaimedPayoutController,
  cancelTopUpOrderController,
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
  getQueueOverviewController,
  listAdminInvoiceTemplatesController,
  listAdminUsersController,
  listTopUpOrdersController,
  listDeadLetterJobsController,
  listPaymentOpsIssuesController,
  reopenPaymentOpsIssueController,
  runPaymentReconciliationController,
  rejectPayoutController,
  resolvePaymentOpsIssueController,
  releaseInvoiceFundsController,
  listAdminPayoutsController,
  listRiskFlagsController,
  listWebhookEventsController,
  updateAdminConfigController,
  updateAdminFaqController,
  updateAdminInvoiceTemplateController,
  updateAdminTestimonialController
} = require('../controllers/adminController');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAdminActor } = require('../middleware/requireAdminActor');
const { requireIdempotencyKey } = require('../middleware/requireIdempotencyKey');

const router = express.Router();

router.get('/users', requireAdminActor, asyncHandler(listAdminUsersController));
router.post('/users/:id/points', requireAdminActor, asyncHandler(adjustAdminUserPointsController));
router.get('/top-up-orders', requireAdminActor, asyncHandler(listTopUpOrdersController));
router.post('/top-up-orders/:id/complete', requireAdminActor, asyncHandler(completeTopUpOrderController));
router.post('/top-up-orders/:id/cancel', requireAdminActor, asyncHandler(cancelTopUpOrderController));
router.get('/invoice-reminders', requireAdminActor, asyncHandler(listInvoiceReminderConfigurationsController));
router.put('/invoice-reminders/:id', requireAdminActor, asyncHandler(updateInvoiceReminderConfigurationController));
router.post('/invoice-reminders/:id/suspend', requireAdminActor, asyncHandler(suspendInvoiceReminderConfigurationController));
router.post('/invoice-reminders/:id/resume', requireAdminActor, asyncHandler(resumeInvoiceReminderConfigurationController));
router.get('/invoice-templates', requireAdminActor, asyncHandler(listAdminInvoiceTemplatesController));
router.post('/invoice-templates', requireAdminActor, asyncHandler(createAdminInvoiceTemplateController));
router.patch('/invoice-templates/:id', requireAdminActor, asyncHandler(updateAdminInvoiceTemplateController));
router.delete('/invoice-templates/:id', requireAdminActor, asyncHandler(deleteAdminInvoiceTemplateController));
router.get('/payouts', requireAdminActor, asyncHandler(listAdminPayoutsController));
router.get('/payment-issues', requireAdminActor, asyncHandler(listPaymentOpsIssuesController));
router.post('/payment-issues/:id/acknowledge', requireAdminActor, asyncHandler(acknowledgePaymentOpsIssueController));
router.post('/payment-issues/:id/resolve', requireAdminActor, asyncHandler(resolvePaymentOpsIssueController));
router.post('/payment-issues/:id/reopen', requireAdminActor, asyncHandler(reopenPaymentOpsIssueController));
router.post('/payouts/:id/approve', requireAdminActor, asyncHandler(approvePayoutController));
router.post('/payouts/:id/cancel-unclaimed', requireAdminActor, asyncHandler(cancelUnclaimedPayoutController));
router.post('/payouts/:id/reject', requireAdminActor, asyncHandler(rejectPayoutController));
router.get('/risk-flags', requireAdminActor, asyncHandler(listRiskFlagsController));
router.get('/webhooks', requireAdminActor, asyncHandler(listWebhookEventsController));
router.get('/queues', requireAdminActor, asyncHandler(getQueueOverviewController));
router.get('/dead-letters', requireAdminActor, asyncHandler(listDeadLetterJobsController));
router.post('/reconciliation/run', requireAdminActor, asyncHandler(runPaymentReconciliationController));
router.patch('/config', requireAdminActor, asyncHandler(updateAdminConfigController));
router.post('/faqs', requireAdminActor, asyncHandler(createAdminFaqController));
router.patch('/faqs/:id', requireAdminActor, asyncHandler(updateAdminFaqController));
router.delete('/faqs/:id', requireAdminActor, asyncHandler(deleteAdminFaqController));
router.post('/testimonials', requireAdminActor, asyncHandler(createAdminTestimonialController));
router.patch('/testimonials/:id', requireAdminActor, asyncHandler(updateAdminTestimonialController));
router.delete('/testimonials/:id', requireAdminActor, asyncHandler(deleteAdminTestimonialController));
router.post('/invoices/:id/release', requireAdminActor, requireIdempotencyKey, asyncHandler(releaseInvoiceFundsController));

module.exports = {
  adminRoutes: router
};
