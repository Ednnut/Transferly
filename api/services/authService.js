const { randomUUID } = require('node:crypto');

const config = require('../config');
const { transaction } = require('../db');
const { authCredentialRepository } = require('../repositories/authCredentialRepository');
const { platformConfigRepository } = require('../repositories/platformConfigRepository');
const { pointTransactionRepository } = require('../repositories/pointTransactionRepository');
const { profileRepository } = require('../repositories/profileRepository');
const { referralEventRepository } = require('../repositories/referralEventRepository');
const { userRepository } = require('../repositories/userRepository');
const { walletRepository } = require('../repositories/walletRepository');
const { auditLogService } = require('./auditLogService');
const {
  AUDIT_ACTOR_TYPE,
  POINT_TRANSACTION_TYPE
} = require('../utils/constants');
const { AppError } = require('../utils/errors');
const { signJwt } = require('../utils/jwt');
const { hashPassword, verifyPassword } = require('../utils/passwords');

function buildAuthPayload(user) {
  const token = signJwt(
    {
      sub: user.id,
      email: user.email,
      role: user.profile?.isAdmin ? 'ADMIN' : 'USER',
      isAdmin: Boolean(user.profile?.isAdmin)
    },
    config.JWT_SECRET,
    config.JWT_EXPIRES_IN_SECONDS
  );

  return {
    token,
    token_type: 'Bearer',
    expires_in: config.JWT_EXPIRES_IN_SECONDS,
    user
  };
}

async function register(input) {
  return transaction(async (client) => {
    const existingUser = await userRepository.findByEmail(input.email, client);
    if (existingUser) {
      throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'A user with that email already exists.');
    }

    const platformConfig = await platformConfigRepository.get(client);
    const referrerProfile = input.referralCode
      ? await profileRepository.findByReferralCode(input.referralCode, client)
      : null;

    if (input.referralCode && !referrerProfile) {
      throw new AppError(404, 'REFERRAL_CODE_NOT_FOUND', 'Referral code was not found.');
    }

    const userId = randomUUID();
    const password = hashPassword(input.password);

    await userRepository.upsert(
      {
        id: userId,
        email: input.email,
        displayName: input.name,
        countryCode: (input.countryCode || 'US').toUpperCase()
      },
      client
    );

    await walletRepository.getOrCreate(client, userId, (input.currencyCode || 'USD').toUpperCase());

    await profileRepository.upsert(
      {
        userId,
        name: input.name,
        isAdmin: false,
        points: platformConfig.signup_bonus,
        referredByUserId: referrerProfile?.userId || null
      },
      client
    );

    await authCredentialRepository.upsert(
      {
        userId,
        passwordHash: password.hash,
        passwordSalt: password.salt
      },
      client
    );

    if (platformConfig.signup_bonus > 0) {
      await pointTransactionRepository.create(
        {
          userId,
          type: POINT_TRANSACTION_TYPE.SIGNUP_BONUS,
          amount: platformConfig.signup_bonus,
          description: 'Signup bonus credited.',
          metadata: {
            source: 'auth.register'
          }
        },
        client
      );
    }

    if (referrerProfile) {
      await profileRepository.incrementPoints(referrerProfile.userId, platformConfig.referral_bonus, client);
      await profileRepository.incrementReferralCount(referrerProfile.userId, 1, client);
      await referralEventRepository.create(
        {
          referrerUserId: referrerProfile.userId,
          referredUserId: userId,
          referralCode: referrerProfile.referralCode,
          bonusPoints: platformConfig.referral_bonus,
          status: 'COMPLETED',
          metadata: {
            source: 'auth.register'
          }
        },
        client
      );
      await pointTransactionRepository.create(
        {
          userId: referrerProfile.userId,
          type: POINT_TRANSACTION_TYPE.REFERRAL_BONUS,
          amount: platformConfig.referral_bonus,
          description: `Referral bonus earned for inviting ${input.email}.`,
          metadata: {
            referredUserId: userId
          }
        },
        client
      );
    }

    await platformConfigRepository.update(
      {
        total_users: Number(platformConfig.total_users || 0) + 1
      },
      client
    );

    await auditLogService.log(
      {
        actorType: AUDIT_ACTOR_TYPE.USER,
        actorId: userId,
        action: 'auth.register',
        entityType: 'user',
        entityId: userId,
        metadata: {
          email: input.email.toLowerCase(),
          referredByUserId: referrerProfile?.userId || null
        }
      },
      client
    );

    const user = await userRepository.findById(userId, client);
    return buildAuthPayload(user);
  });
}

async function login(input) {
  const user = await userRepository.findByEmail(input.email);
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const credential = await authCredentialRepository.findByUserId(user.id);
  if (!credential || !verifyPassword(input.password, credential.passwordSalt, credential.passwordHash)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  await authCredentialRepository.touchLastLogin(user.id);
  return buildAuthPayload(await userRepository.findById(user.id));
}

module.exports = {
  authService: {
    register,
    login
  }
};
