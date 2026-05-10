'use strict';

/*
 * Configuration for the Telegram bot
 */

require('dotenv').config();
const required = ['ADMIN_TELEGRAM_ID', 'ADMIN_TELEGRAM_USERNAME', 'API_URL', 'BOT_TOKEN'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ Bot environment is missing required variables:');
  missing.forEach((key) => console.error(`   - ${key}`));
  console.error('Edit bot/.env and supply the values. You can scaffold the file with `npm run setup --prefix bot` from the repo root.');
  process.exit(1);
}

const apiSecret = process.env.API_SECRET;
const adminApiToken = apiSecret || process.env.ADMIN_API_TOKEN;
const apiHmacSecret = apiSecret || process.env.API_HMAC_SECRET || '';
if (!adminApiToken) {
  console.error('❌ Bot environment is missing API credentials. Set API_SECRET or ADMIN_API_TOKEN.');
  process.exit(1);
}

try {
  // eslint-disable-next-line no-new
  new URL(process.env.API_URL);
} catch (error) {
  console.error(`❌ Invalid API_URL: ${process.env.API_URL || 'undefined'} (${error.message})`);
  process.exit(1);
}

// Check for required environment variables

module.exports = {
  admin: {
    userId: process.env.ADMIN_TELEGRAM_ID,
    ownerId: process.env.OWNER_TELEGRAM_ID || process.env.ADMIN_TELEGRAM_ID,
    ownerExplicit: Boolean(process.env.OWNER_TELEGRAM_ID),
    username: process.env.ADMIN_TELEGRAM_USERNAME,
    apiToken: adminApiToken
  },
  apiUrl: process.env.API_URL,
  botToken: process.env.BOT_TOKEN,
  scriptsApiUrl: process.env.API_URL,
  apiAuth: {
    hmacSecret: apiHmacSecret,
  },
};
