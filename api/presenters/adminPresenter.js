const { presentInvoice, presentPayout } = require('./paymentPresenter');
const { formatMoney } = require('../utils/money');

function presentAdminInvoice(invoice) {
  const provider = String(invoice.metadata?.provider || 'paypal').toLowerCase();
  const providerActions = {
    paypal: ['refresh', 'release_funds', 'open_hosted_link', 'cancel'],
    stripe: ['refresh', 'release_funds', 'open_hosted_link', 'open_pdf', 'void'],
    crypto: ['refresh', 'release_funds', 'open_hosted_link', 'mark_review_required']
  };

  return {
    ...presentInvoice(invoice),
    user_id: invoice.userId,
    provider,
    admin_actions: providerActions[provider] || ['refresh', 'open_hosted_link']
  };
}

function presentAdminPayout(payout) {
  return {
    ...presentPayout(payout),
    user_id: payout.userId
  };
}

function presentAdminUser(user) {
  return {
    user_id: user.id,
    email: user.email,
    name: user.name || user.displayName || '',
    display_name: user.displayName || null,
    country_code: user.countryCode || null,
    points: user.points ?? 0,
    referral_count: user.referral_count ?? 0,
    referral_code: user.referral_code ?? null,
    is_admin: Boolean(user.is_admin),
    receipt_count: user.receipt_count ?? 0,
    created_at: user.createdAt || user.created_at,
    updated_at: user.updatedAt || user.updated_at,
    profile: user.profile || null,
    wallet: user.wallet || null
  };
}

function presentRiskFlag(flag) {
  return {
    risk_flag_id: flag.id,
    user_id: flag.userId,
    invoice_id: flag.invoiceId,
    payout_id: flag.payoutId,
    rule_code: flag.ruleCode,
    severity: flag.severity,
    status: flag.status,
    reason: flag.reason,
    metadata: flag.metadata || {},
    created_at: flag.createdAt,
    resolved_at: flag.resolvedAt || null
  };
}

function presentWebhookEvent(event) {
  return {
    webhook_event_id: event.id,
    event_id: event.eventId,
    event_type: event.eventType,
    resource_type: event.resourceType,
    transmission_id: event.transmissionId,
    status: event.status,
    processing_attempts: event.processingAttempts,
    last_error: event.lastError || null,
    processed_at: event.processedAt || null,
    created_at: event.createdAt,
    updated_at: event.updatedAt
  };
}

function presentFundRelease(result) {
  return {
    invoice_id: result.invoice.paypalInvoiceId,
    internal_invoice_id: result.invoice.id,
    released_amount: formatMoney(result.amountCents),
    currency: result.invoice.currencyCode,
    remaining_releasable_amount: formatMoney(result.remainingReleasableCents),
    wallet: {
      pending_balance: formatMoney(result.wallet.pendingBalanceCents),
      available_balance: formatMoney(result.wallet.availableBalanceCents),
      frozen_balance: formatMoney(result.wallet.frozenBalanceCents),
      paid_out_balance: formatMoney(result.wallet.paidOutBalanceCents),
      currency: result.wallet.currencyCode
    }
  };
}

function presentQueueOverview(overview) {
  return {
    generated_at: overview.generated_at,
    redis_status: overview.redis_status,
    queues: overview.queues.map((queue) => ({
      key: queue.key,
      name: queue.name,
      counts: queue.counts
    }))
  };
}

function presentDeadLetterJob(job) {
  return {
    job_id: job.job_id,
    name: job.name,
    attempts_made: job.attempts_made,
    failed_reason: job.failed_reason,
    queue_name: job.queue_name,
    data: job.data,
    created_at: job.created_at,
    finished_at: job.finished_at
  };
}

function presentInvoiceTemplate(template) {
  return {
    id: template.id,
    name: template.name,
    description: template.description || null,
    currency_code: template.currency_code,
    default_due_days: template.default_due_days ?? null,
    line_items: template.line_items || [],
    metadata: template.metadata || {},
    is_active: Boolean(template.is_active),
    created_at: template.created_at,
    updated_at: template.updated_at
  };
}

function presentInvoiceReminderConfiguration(configuration) {
  return {
    id: configuration.id,
    type: configuration.type,
    status: configuration.status || null,
    interval: configuration.interval || null,
    repetition: configuration.repetition ?? null,
    notification: configuration.notification || {},
    metadata: configuration.metadata || {},
    links: configuration.links || []
  };
}

function presentPaymentOpsIssue(issue) {
  return {
    payment_issue_id: issue.id,
    entity_type: issue.entityType,
    entity_id: issue.entityId,
    issue_type: issue.issueType,
    severity: issue.severity,
    status: issue.status,
    summary: issue.summary,
    metadata: issue.metadata || {},
    acknowledgement: {
      acknowledged_at: issue.metadata?.acknowledged_at || null,
      acknowledged_by_actor_id: issue.metadata?.acknowledged_by_actor_id || null,
      acknowledgement_note: issue.metadata?.acknowledgement_note || null
    },
    resolution: {
      resolved_at: issue.metadata?.resolved_at || issue.resolvedAt || null,
      resolved_by_actor_id: issue.metadata?.resolved_by_actor_id || null,
      resolution_note: issue.metadata?.resolution_note || null
    },
    first_seen_at: issue.firstSeenAt,
    last_seen_at: issue.lastSeenAt,
    resolved_at: issue.resolvedAt || null,
    created_at: issue.createdAt,
    updated_at: issue.updatedAt
  };
}

module.exports = {
  presentAdminInvoice,
  presentAdminUser,
  presentAdminPayout,
  presentInvoiceReminderConfiguration,
  presentInvoiceTemplate,
  presentPaymentOpsIssue,
  presentRiskFlag,
  presentWebhookEvent,
  presentFundRelease,
  presentQueueOverview,
  presentDeadLetterJob
};
