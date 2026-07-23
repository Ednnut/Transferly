const { buildQueueJobId } = require('../utils/queueJobId');
const { WORKER_FAILURE_CLASSIFICATION } = require('../utils/constants');

const RETRY_DELAYS_MS = Object.freeze({
  initialPayoutPoll: 60_000,
  followUpPayoutPoll: 5 * 60_000
});

function buildDeadLetterPayload(queueName, job, error) {
  if (!job) {
    return null;
  }

  return {
    sourceQueue: queueName,
    sourceJobId: job.id || null,
    payload: job.data,
    error: error.message
  };
}

async function enqueueDeadLetter(deadLetterQueue, queueName, job, error) {
  const payload = buildDeadLetterPayload(queueName, job, error);
  if (!payload) {
    return;
  }

  await deadLetterQueue.add(`${queueName}-dead-letter`, payload);
}

function classifyWorkerFailure(error) {
  if (typeof error?.retryable === 'boolean') {
    return {
      classification: error.retryable
        ? WORKER_FAILURE_CLASSIFICATION.RETRYABLE
        : WORKER_FAILURE_CLASSIFICATION.TERMINAL,
      retryable: error.retryable,
      code: error.code || null
    };
  }

  if (error?.code === 'ORDER_PROCESSING_LOCKED') {
    return {
      classification: WORKER_FAILURE_CLASSIFICATION.RETRYABLE,
      retryable: true,
      code: error.code
    };
  }

  const statusCode = Number(error?.statusCode || error?.status);
  const retryableStatusCodes = new Set([408, 425, 429]);
  const terminal =
    Number.isInteger(statusCode) &&
    statusCode >= 400 &&
    statusCode < 500 &&
    !retryableStatusCodes.has(statusCode);

  return {
    classification: terminal
      ? WORKER_FAILURE_CLASSIFICATION.TERMINAL
      : WORKER_FAILURE_CLASSIFICATION.RETRYABLE,
    retryable: !terminal,
    code: error?.code || null
  };
}

function hasExhaustedAttempts(job, error) {
  if (job?.discarded || !classifyWorkerFailure(error).retryable) {
    return true;
  }

  const attempts = typeof job?.opts?.attempts === 'number' ? job.opts.attempts : 1;
  return (job?.attemptsMade || 0) >= attempts;
}

function createClassifiedJobProcessor(processor) {
  return async (job) => {
    try {
      return await processor(job);
    } catch (error) {
      if (!classifyWorkerFailure(error).retryable && typeof job?.discard === 'function') {
        job.discard();
      }
      throw error;
    }
  };
}

async function schedulePayoutRetry(retryQueue, payoutId, delayMs, now = Date.now) {
  await retryQueue.add(
    'retry-payout-status-poll',
    { payoutId },
    {
      jobId: buildQueueJobId('payout-retry', payoutId, now()),
      delay: delayMs
    }
  );
}

function createPayoutJobProcessor({ payoutService, retryQueue, retryDelayMs, now = Date.now }) {
  return async (job) => {
    const result = await payoutService.processQueuedPayout(job.data.payoutId);

    if (payoutService.isProviderPendingStatus(result.status)) {
      await schedulePayoutRetry(retryQueue, job.data.payoutId, retryDelayMs, now);
    }

    return result;
  };
}

function createOrderJobProcessor({ orderService }) {
  return async (job) => orderService.processQueuedOrder({
    orderId: job.data.orderId,
    dispatchGeneration: job.data.dispatchGeneration,
    jobId: job.id || null,
    correlationId: job.data.correlationId || job.id || null,
    queueAttempt: Number(job.attemptsMade || 0) + 1
  });
}

function createWorkerFailureHandler({ queueName, deadLetterQueue, onExhausted, deadLetterHandler }) {
  return async (job, error) => {
    if (!hasExhaustedAttempts(job, error)) {
      return;
    }

    const failures = [];
    try {
      if (onExhausted) {
        await onExhausted(job, error);
      }
    } catch (hookError) {
      failures.push(hookError);
    }

    try {
      const handler = deadLetterHandler || ((failedJob, failedError) =>
        enqueueDeadLetter(deadLetterQueue, queueName, failedJob, failedError));
      await handler(job, error);
    } catch (deadLetterError) {
      failures.push(deadLetterError);
    }

    if (failures.length === 1) {
      throw failures[0];
    }
    if (failures.length > 1) {
      throw new AggregateError(failures, `Failed to finalize exhausted ${queueName} job.`);
    }
  };
}

module.exports = {
  RETRY_DELAYS_MS,
  buildDeadLetterPayload,
  classifyWorkerFailure,
  createClassifiedJobProcessor,
  enqueueDeadLetter,
  hasExhaustedAttempts,
  createOrderJobProcessor,
  schedulePayoutRetry,
  createPayoutJobProcessor,
  createWorkerFailureHandler
};
