const config = require('../config');
const { profileRepository } = require('../repositories/profileRepository');
const { telegramRepository } = require('../repositories/telegramRepository');
const { userRepository } = require('../repositories/userRepository');
const { AppError } = require('../utils/errors');
const { referralService } = require('./referralService');
const { slipcraftReceiptService } = require('./slipcraftReceiptService');
const { slipcraftUserService } = require('./slipcraftUserService');

function parseTelegramCommand(text) {
  const trimmed = String(text || '').trim();
  const [rawCommand, ...parts] = trimmed.split(/\s+/);
  return {
    command: rawCommand || '',
    args: parts,
    rawArgs: parts.join(' ')
  };
}

function parseReceiptDetails(rawValue) {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (_error) {
    // Fall back to a plain note field.
  }

  return {
    note: rawValue
  };
}

async function resolveLinkedUser(account) {
  if (!account || !account.userId) {
    throw new AppError(
      400,
      'TELEGRAM_ACCOUNT_NOT_LINKED',
      'Telegram account is not linked. Link it from the Transferly web app first.'
    );
  }

  const user = await userRepository.findById(account.userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Linked user was not found.');
  }

  return user;
}

async function handleBalance(account) {
  const summary = await slipcraftUserService.getPointsSummary(account.userId);
  return {
    ok: true,
    message: `Current points: ${summary.points}`,
    data: summary
  };
}

async function handleGenerateReceipt(account, parsedCommand) {
  const type = parsedCommand.args[0] || 'bank';
  const rawDetails = parsedCommand.args.slice(1).join(' ');
  const details = parseReceiptDetails(rawDetails);
  const result = await slipcraftReceiptService.generateReceipt({
    userId: account.userId,
    type,
    title: `Telegram ${String(type).toUpperCase()} Receipt`,
    summary: 'Generated from Telegram bot.',
    details
  });

  return {
    ok: true,
    message: `Receipt generated. Remaining points: ${result.summary.remaining_points}`,
    data: result
  };
}

async function handleHistory(account) {
  const receipts = await slipcraftReceiptService.getReceiptHistory(account.userId, 10);
  return {
    ok: true,
    message: `Found ${receipts.length} receipts.`,
    data: receipts
  };
}

async function handleReferral(account) {
  const stats = await referralService.getStats(account.userId);
  return {
    ok: true,
    message: `Referral code: ${stats.referral_code}. Total referrals: ${stats.referral_count}.`,
    data: stats
  };
}

async function handleProfile(account) {
  const user = await resolveLinkedUser(account);
  const profile = await profileRepository.findByUserId(user.id);

  return {
    ok: true,
    message: `Profile for ${profile.name}.`,
    data: {
      user_id: user.id,
      email: user.email,
      name: profile.name,
      points: profile.points,
      referral_code: profile.referralCode,
      telegram_username: profile.telegramUsername
    }
  };
}

async function dispatchCommand(account, parsedCommand) {
  switch (parsedCommand.command) {
    case '/balance':
      await resolveLinkedUser(account);
      return handleBalance(account);
    case '/generate_receipt':
      await resolveLinkedUser(account);
      return handleGenerateReceipt(account, parsedCommand);
    case '/history':
      await resolveLinkedUser(account);
      return handleHistory(account);
    case '/referral':
      await resolveLinkedUser(account);
      return handleReferral(account);
    case '/profile':
      if (!account.userId) {
        return {
          ok: true,
          message: 'Telegram account is not linked yet. Link it from the Transferly web app.',
          data: {
            linked: false
          }
        };
      }

      return handleProfile(account);
    default:
      throw new AppError(400, 'UNSUPPORTED_TELEGRAM_COMMAND', 'Unsupported Telegram command.');
  }
}

async function handleWebhook(update) {
  const parsedCommand = parseTelegramCommand(update.message.text);
  const account = await telegramRepository.upsertAccount({
    userId: (await telegramRepository.findAccountByTelegramUserId(update.message.from.id))?.userId || null,
    telegramUserId: update.message.from.id,
    chatId: update.message.chat.id,
    username: update.message.from.username || null,
    firstName: update.message.from.first_name || null,
    lastName: update.message.from.last_name || null
  });

  if (account.userId) {
    await profileRepository.updateByUserId(account.userId, {
      telegramChatId: account.chatId,
      telegramUsername: account.username || null
    });
  }

  const response = await dispatchCommand(account, parsedCommand);

  await telegramRepository.createCommandLog({
    telegramUserId: account.telegramUserId,
    chatId: account.chatId,
    command: parsedCommand.command,
    arguments: {
      args: parsedCommand.args,
      raw: parsedCommand.rawArgs
    },
    response,
    status: 'PROCESSED'
  });

  return {
    ok: true,
    telegram_api_base: config.TELEGRAM_API_BASE,
    command: parsedCommand.command,
    response
  };
}

module.exports = {
  telegramBotService: {
    handleWebhook
  }
};
