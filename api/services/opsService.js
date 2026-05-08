const QUEUE_COUNT_STATES = Object.freeze([
  'waiting',
  'active',
  'completed',
  'failed',
  'delayed',
  'paused'
]);

function getQueueRuntime() {
  return require('../jobs/queues');
}

function buildQueueRegistry(runtime) {
  return [
    { key: 'invoice_send', name: runtime.queueNames.invoiceSend, queue: runtime.invoiceSendQueue },
    { key: 'payout_process', name: runtime.queueNames.payoutProcess, queue: runtime.payoutProcessQueue },
    { key: 'webhook_process', name: runtime.queueNames.webhookProcess, queue: runtime.webhookProcessQueue },
    { key: 'payout_retry', name: runtime.queueNames.payoutRetry, queue: runtime.payoutRetryQueue },
    { key: 'payment_reconciliation', name: runtime.queueNames.reconciliation, queue: runtime.reconciliationQueue },
    { key: 'dead_letter', name: runtime.queueNames.deadLetter, queue: runtime.deadLetterQueue }
  ];
}

function presentQueueCounts(counts) {
  return QUEUE_COUNT_STATES.reduce((result, state) => {
    result[state] = counts[state] || 0;
    return result;
  }, {});
}

async function buildQueueSnapshot(entry) {
  const counts = await entry.queue.getJobCounts(...QUEUE_COUNT_STATES);
  return {
    key: entry.key,
    name: entry.name,
    counts: presentQueueCounts(counts)
  };
}

function mapDeadLetterJob(job) {
  return {
    job_id: job.id,
    name: job.name,
    attempts_made: job.attemptsMade,
    failed_reason: job.failedReason || null,
    queue_name: job.queueName,
    data: job.data || {},
    created_at: job.timestamp ? new Date(job.timestamp).toISOString() : null,
    finished_at: job.finishedOn ? new Date(job.finishedOn).toISOString() : null
  };
}

async function getQueueOverview() {
  const runtime = getQueueRuntime();
  const queues = await Promise.all(buildQueueRegistry(runtime).map(buildQueueSnapshot));
  return {
    generated_at: new Date().toISOString(),
    redis_status: runtime.redisConnection.status,
    queues
  };
}

async function listDeadLetterJobs(limit = 50) {
  const runtime = getQueueRuntime();
  const jobs = await runtime.deadLetterQueue.getJobs(
    ['waiting', 'delayed', 'active', 'completed', 'failed'],
    0,
    Math.max(limit - 1, 0),
    false
  );

  return jobs.map(mapDeadLetterJob);
}

const opsService = {
  getQueueOverview,
  listDeadLetterJobs
};

module.exports = {
  opsService,
  QUEUE_COUNT_STATES,
  buildQueueSnapshot,
  getQueueOverview,
  listDeadLetterJobs,
  mapDeadLetterJob
};
