---
inclusion: fileMatch
fileMatch: "bot/**"
---

# Telegram Bot Development Patterns

These patterns apply when working in the `bot/` package.

## Stack

- **Runtime**: Node.js, CommonJS
- **Framework**: grammY-style command/callback modules
- **Persistence**: SQLite (`bot/db/db.js` — full DB logic)
- **Config**: `bot/config.js`
- **Entry**: `bot/bot.js`

## File Organization

```
bot/
  bot.js          — Main bot entry, middleware registration, update routing
  config.js       — All config with env-var defaults
  commands/       — Command handlers (one file per command group)
  callbacks/      — Inline keyboard callback handlers
  utils/          — Shared helpers (apiContract, httpClient, sessionState, etc.)
  db/             — SQLite schema, migrations, and queries
  scripts/        — Smoke tests and operational scripts
  tests/          — Unit and contract tests
```

## Adding a New Command

1. Create `bot/commands/mycommand.js` exporting a handler function
2. Register it in `bot/commands/index.js`
3. Mount in `bot/bot.js` with the correct middleware order
4. Update the bot menu with `node bot/scripts/configureMiniAppMenu.js` if it should appear in the command menu

## Adding a Callback Handler

1. Create or extend `bot/callbacks/` module
2. Register in `bot/callbacks/index.js`
3. Keep callback data strings short and deterministic

## API Contract

The bot calls the Transferly API. All API interaction goes through:
- `bot/utils/httpClient.js` — HTTP client with retry/timeout
- `bot/utils/apiContract.js` — Typed request/response helpers
- `bot/utils/apiAuth.js` — Bearer token injection

Never call the API directly from command handlers; always use `apiContract`.

## Session State

- User session state: `bot/utils/sessionState.js`
- Backed by SQLite
- Clear state on command cancellation

## Security

- Verify Telegram webhook secret header (`TELEGRAM_WEBHOOK_SECRET`) before processing any update
- Validate `initData` HMAC for Mini App deep links using `bot/utils/` helpers
- Never log user chat IDs, phone numbers, or session tokens in plain text
- Rate-limit commands per user: `bot/utils/rateLimit.js`

## Provider Workspaces

Provider workspace flows live in `bot/utils/providerWorkspaces.js`. This is the primary UX for the bot's payment operations — check it before adding new provider-facing commands.

The `bot/utils/capabilities.js` module determines which features are available to each user.

## Testing

- Runner: `node --test` (Node.js built-in)
- Tests: `bot/tests/`
- Run: `npm test --prefix bot`
- Key test files:
  - `apiContract.test.js` — API shape parity
  - `providerMiniappParity.test.js` — Bot/miniapp feature alignment
  - `screen.test.js` — Screen rendering

## Deployment

PM2 ecosystem: `bot/ecosystem.config.js`

```bash
pm2 start bot/ecosystem.config.js --env production
```

Requires `bot/.env` with `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and `API_BASE_URL` at minimum.

Live smoke test:
```bash
node bot/scripts/liveTelegramSmoke.js
```
