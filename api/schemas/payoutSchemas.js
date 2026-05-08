const { z } = require('zod');

const createPayoutSchema = z.object({
  userId: z.string().min(1),
  receiver: z.string().min(1),
  recipientType: z.enum(['EMAIL', 'PHONE', 'PAYPAL_ID']).default('EMAIL'),
  receiverCountryCode: z.string().length(2).optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3),
  note: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional()
});

const rejectPayoutSchema = z.object({
  reason: z.string().max(1000).optional()
});

const payoutParamsSchema = z.object({
  id: z.string().trim().min(1)
});

const paymentTimelineQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(25)
});

module.exports = {
  createPayoutSchema,
  rejectPayoutSchema,
  payoutParamsSchema,
  paymentTimelineQuerySchema
};
