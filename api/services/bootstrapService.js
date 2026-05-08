const config = require('../config');
const { transaction } = require('../db');
const { authCredentialRepository } = require('../repositories/authCredentialRepository');
const { faqRepository } = require('../repositories/faqRepository');
const { platformConfigRepository } = require('../repositories/platformConfigRepository');
const { profileRepository } = require('../repositories/profileRepository');
const { testimonialRepository } = require('../repositories/testimonialRepository');
const { topUpOrderRepository } = require('../repositories/topUpOrderRepository');
const { userRepository } = require('../repositories/userRepository');
const { walletRepository } = require('../repositories/walletRepository');
const { auditLogService } = require('./auditLogService');
const { AUDIT_ACTOR_TYPE } = require('../utils/constants');
const { hashPassword } = require('../utils/passwords');
const { referralService } = require('./referralService');
const { slipcraftReceiptService } = require('./slipcraftReceiptService');
const { slipcraftUserService } = require('./slipcraftUserService');

async function ensureDemoAccount(input = {}) {
  const seed = {
    userId: input.userId || config.SEED_USER_ID || 'demo-user',
    email: input.email || config.SEED_USER_EMAIL || 'demo@flashing.local',
    displayName: input.displayName || config.SEED_USER_NAME || 'Demo User',
    countryCode: (input.countryCode || config.SEED_USER_COUNTRY || 'US').toUpperCase(),
    currencyCode: (input.currencyCode || config.SEED_WALLET_CURRENCY || 'USD').toUpperCase(),
    pendingBalanceCents: input.pendingBalanceCents ?? config.SEED_PENDING_BALANCE ?? 0,
    availableBalanceCents: input.availableBalanceCents ?? config.SEED_AVAILABLE_BALANCE ?? 250000,
    frozenBalanceCents: input.frozenBalanceCents ?? config.SEED_FROZEN_BALANCE ?? 0,
    paidOutBalanceCents: input.paidOutBalanceCents ?? config.SEED_PAID_OUT_BALANCE ?? 0,
    adminActorId: input.adminActorId || config.SEED_ADMIN_ACTOR_ID || 'admin-demo',
    password: input.password || config.SEED_USER_PASSWORD || 'password123',
    signupBonus: input.signupBonus,
    referralCode: input.referralCode,
    referredByUserId: input.referredByUserId || null,
    isAdmin: Boolean(input.isAdmin ?? config.SEED_USER_IS_ADMIN ?? true)
  };

  return transaction(async (client) => {
    const user = await userRepository.upsert(
      {
        id: seed.userId,
        email: seed.email,
        displayName: seed.displayName,
        countryCode: seed.countryCode
      },
      client
    );

    const wallet = await walletRepository.seedBalances(client, user.id, seed.currencyCode, {
      pendingBalanceCents: seed.pendingBalanceCents,
      availableBalanceCents: seed.availableBalanceCents,
      frozenBalanceCents: seed.frozenBalanceCents,
      paidOutBalanceCents: seed.paidOutBalanceCents
    });

    const profile = await profileRepository.upsert(
      {
        userId: user.id,
        name: seed.displayName,
        isAdmin: seed.isAdmin,
        points: seed.signupBonus ?? config.SEED_SIGNUP_BONUS ?? 500,
        referralCode: seed.referralCode,
        referredByUserId: seed.referredByUserId
      },
      client
    );

    const password = hashPassword(seed.password);
    await authCredentialRepository.upsert(
      {
        userId: user.id,
        passwordHash: password.hash,
        passwordSalt: password.salt
      },
      client
    );

    const platformConfig = await platformConfigRepository.ensureDefault(client);

    await auditLogService.log(
      {
        actorType: AUDIT_ACTOR_TYPE.SYSTEM,
        actorId: seed.adminActorId,
        action: 'bootstrap.demo-account',
        entityType: 'user',
        entityId: user.id,
        metadata: {
          walletId: wallet.id,
          profileId: profile.id,
          currencyCode: wallet.currencyCode,
          balances: {
            pending: wallet.pendingBalanceCents,
            available: wallet.availableBalanceCents,
            frozen: wallet.frozenBalanceCents,
            paidOut: wallet.paidOutBalanceCents
          },
          platformConfigId: platformConfig.id
        }
      },
      client
    );

    return {
      user: {
        ...user,
        profile,
        wallet
      },
      adminActorId: seed.adminActorId
    };
  });
}

async function getPublicBootstrap() {
  const [platform, faqs, testimonials] = await Promise.all([
    platformConfigRepository.get(),
    faqRepository.findAll(),
    testimonialRepository.findAll({ onlyActive: true })
  ]);

  return {
    platform,
    faqs,
    testimonials
  };
}

async function getCurrentUserSnapshot(userId) {
  const [user, profile, points, receipts, referrals, topUpOrders] = await Promise.all([
    userRepository.findById(userId),
    profileRepository.findByUserId(userId),
    slipcraftUserService.getPointsSummary(userId),
    slipcraftReceiptService.getReceiptHistory(userId, 10),
    referralService.getStats(userId),
    topUpOrderRepository.findByUserId(userId)
  ]);

  return {
    user,
    profile,
    points,
    receipts,
    referrals,
    topUpOrders
  };
}

module.exports = {
  bootstrapService: {
    ensureDemoAccount,
    getPublicBootstrap,
    getCurrentUserSnapshot
  }
};
