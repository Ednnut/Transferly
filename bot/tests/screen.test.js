const assert = require("node:assert/strict");
const test = require("node:test");
const {
  SCREEN_TYPES,
  TELEGRAM_COMMANDS,
  buildScreenKeyboard,
  buildStartKeyboard,
  buildMainMenuKeyboard,
  buildBackKeyboard,
  buildUsersKeyboard,
  buildUsersListKeyboard,
  buildUserDetailKeyboard,
  buildUsersAuditKeyboard,
  buildPaymentAuditKeyboard,
  buildBotAnalyticsKeyboard,
  buildSubscriptionAlertsKeyboard,
  buildSubscriptionDurationKeyboard,
  buildUserConfirmKeyboard,
  buildServiceGroupsKeyboard,
  buildServiceSearchResultsKeyboard,
  buildPayPalWorkspaceKeyboard,
  buildPayPalListKeyboard,
  buildInvoiceResultKeyboard,
  buildPayoutResultKeyboard,
  buildCallbackRecoveryKeyboard,
  invoiceReleaseGuard,
  payoutActionGuard,
  rememberScreen,
  prepareNavigationAction,
  popBackAction,
  resetNavigation,
} = require("../bot");
const { handlePublicCallback } = require("../callbacks/public");
const { handleServiceCallback } = require("../callbacks/services");
const { handlePaymentCallback } = require("../callbacks/payments");
const { handleUserCallback } = require("../callbacks/users");
const { searchServices } = require("../utils/serviceCatalog");
const { ROLES, STATUS, CAPABILITIES, hasCapability, getActionCapability } = require("../utils/capabilities");
const { initialSessionState } = require("../utils/sessionState");

function ctx() {
  return {
    session: initialSessionState(),
  };
}

function labels(keyboard) {
  return (keyboard.inline_keyboard || []).flat().map((button) => button.text);
}

function callbackActions(keyboard) {
  return (keyboard.inline_keyboard || [])
    .flat()
    .map((button) => button.callback_data)
    .filter(Boolean)
    .map((data) => {
      const value = String(data);
      return value.startsWith("cb|") ? value.split("|")[1] : value;
    });
}

test("visible Telegram command menu stays intentionally small", () => {
  assert.deepEqual(
    TELEGRAM_COMMANDS.map((command) => command.command),
    ["start", "menu", "help", "services", "whoami", "cancel"],
  );
});

test("start launcher only exposes visible command entry points", () => {
  const startLabels = labels(buildStartKeyboard(ctx(), { role: ROLES.OWNER, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: true, isOwner: true }));
  assert.deepEqual(startLabels, ["📋 Menu", "🧰 Services", "🪪 Whoami", "📚 Help", "✖️ Cancel Prompt"]);
  assert.equal(startLabels.includes("🏦 Bank Slips"), false);
  assert.equal(startLabels.includes("📄 Invoices"), false);
  assert.equal(startLabels.includes("👥 Users"), false);
});

test("main menu is role-aware", () => {
  const guestLabels = labels(buildMainMenuKeyboard(ctx(), { role: ROLES.GUEST, isAuthorized: false }));
  assert.deepEqual(guestLabels.slice(0, 2), ["🪪 Whoami", "📚 Help"]);
  assert.equal(guestLabels.includes("🏦 Bank Slips"), false);

  const userLabels = labels(buildMainMenuKeyboard(ctx(), { role: ROLES.USER, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: false }));
  assert.ok(userLabels.includes("🏦 Bank Slips"));
  assert.ok(userLabels.includes("🧾 Receipts"));
  assert.equal(userLabels.includes("📄 Invoices"), false);
  assert.equal(userLabels.includes("💸 Payouts"), false);
  assert.equal(userLabels.includes("👥 Users"), false);

  const adminLabels = labels(buildMainMenuKeyboard(ctx(), { role: ROLES.ADMIN, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: true }));
  assert.ok(adminLabels.includes("📄 Invoices"));
  assert.ok(adminLabels.includes("💸 Payouts"));
  assert.ok(adminLabels.includes("🤖 Bot Ops"));
  assert.equal(adminLabels.includes("👥 Users"), false);

  const ownerLabels = labels(buildMainMenuKeyboard(ctx(), { role: ROLES.OWNER, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: true, isOwner: true }));
  assert.ok(ownerLabels.includes("📄 Invoices"));
  assert.ok(ownerLabels.includes("💸 Payouts"));
  assert.ok(ownerLabels.includes("👥 Users"));
});

test("screen router prevents detail screens from rendering the main grid", () => {
  const detailLabels = labels(buildScreenKeyboard(ctx(), SCREEN_TYPES.DETAIL));
  assert.deepEqual(detailLabels, ["⬅️ Back", "🏠 Main Menu"]);

  const mainLabels = labels(buildScreenKeyboard(ctx(), SCREEN_TYPES.MAIN, { access: { role: ROLES.ADMIN, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: true } }));
  assert.ok(mainLabels.includes("📄 Invoices"));
  assert.ok(mainLabels.includes("💸 Payouts"));
});

test("service catalog exposes search from services screen", () => {
  const serviceLabels = labels(buildServiceGroupsKeyboard(ctx()));
  assert.ok(serviceLabels.includes("🔎 Search Service"));

  const matches = searchServices("paypal");
  assert.equal(matches[0].slug, "paypal");

  const resultLabels = labels(buildServiceSearchResultsKeyboard(ctx(), matches.slice(0, 1)));
  assert.ok(resultLabels.includes("PayPal"));
  assert.ok(resultLabels.includes("🔎 Search Again"));
});

test("PayPal workspace exposes invoice and payout search", () => {
  const userLabels = labels(buildPayPalWorkspaceKeyboard(ctx(), { role: ROLES.USER, status: STATUS.ACTIVE, isAuthorized: true }));
  assert.ok(userLabels.includes("✉️ Flash Email"));
  assert.equal(userLabels.includes("🔎 Search Invoice"), false);
  assert.equal(userLabels.includes("🔎 Search Payout"), false);

  const paypalLabels = labels(buildPayPalWorkspaceKeyboard(ctx(), { role: ROLES.ADMIN, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: true }));
  assert.ok(paypalLabels.includes("🔎 Search Invoice"));
  assert.ok(paypalLabels.includes("🔎 Search Payout"));
});

test("capabilities allow authorized users to use services but block payment ops", () => {
  const user = { role: ROLES.USER, status: STATUS.ACTIVE };
  const admin = { role: ROLES.ADMIN, status: STATUS.ACTIVE };
  const guest = { role: ROLES.GUEST, status: STATUS.ACTIVE };

  assert.equal(hasCapability(user, CAPABILITIES.SERVICES_USE), true);
  assert.equal(hasCapability(user, CAPABILITIES.PAYMENTS_READ), false);
  assert.equal(hasCapability(admin, CAPABILITIES.PAYMENTS_READ), true);
  assert.equal(hasCapability(admin, CAPABILITIES.USERS_MANAGE), false);
  assert.equal(hasCapability({ role: ROLES.OWNER, status: STATUS.ACTIVE }, CAPABILITIES.USERS_MANAGE), true);
  assert.equal(hasCapability({ role: ROLES.OWNER, status: STATUS.ACTIVE, subscriptionExpired: true }, CAPABILITIES.USERS_MANAGE), true);
  assert.equal(hasCapability({ role: ROLES.ADMIN, status: STATUS.ACTIVE, subscriptionExpired: true }, CAPABILITIES.PAYMENTS_READ), false);
  assert.equal(hasCapability({ role: ROLES.USER, status: STATUS.ACTIVE, subscriptionExpired: true }, CAPABILITIES.SERVICES_USE), false);
  assert.equal(hasCapability(guest, CAPABILITIES.SERVICES_USE), false);
  assert.equal(getActionCapability("GROUP:BANK"), CAPABILITIES.SERVICES_USE);
  assert.equal(getActionCapability("PP:INV"), CAPABILITIES.PAYMENTS_READ);
  assert.equal(getActionCapability("BOT_OPS"), CAPABILITIES.SYSTEM_STATUS);
  assert.equal(getActionCapability("USER_D:123"), CAPABILITIES.USERS_MANAGE);
});

test("owner user-management keyboards include duration presets and confirmation controls", () => {
  const usersLabels = labels(buildUsersKeyboard(ctx()));
  assert.ok(usersLabels.includes("📋 List Users"));
  assert.ok(usersLabels.includes("⏳ Expiring"));
  assert.ok(usersLabels.includes("🔎 Search Users"));
  assert.ok(usersLabels.includes("🔔 Alerts"));
  assert.ok(usersLabels.includes("➕ Add User"));
  assert.ok(usersLabels.includes("⬆️ Promote User"));
  assert.ok(usersLabels.includes("⬇️ Demote User"));
  assert.ok(usersLabels.includes("⏸ Suspend"));
  assert.ok(usersLabels.includes("▶️ Reactivate"));
  assert.ok(usersLabels.includes("❌ Revoke"));
  assert.ok(usersLabels.includes("🧾 Audit Logs"));
  assert.ok(usersLabels.includes("📊 Analytics"));

  const userListLabels = labels(buildUsersListKeyboard(ctx(), [{ telegram_id: 123, username: "alice", role: ROLES.USER }]));
  assert.ok(userListLabels.includes("USER · @alice"));

  const detailLabels = labels(buildUserDetailKeyboard(ctx(), { telegram_id: 123, username: "alice", role: ROLES.USER, status: STATUS.ACTIVE }));
  assert.ok(detailLabels.includes("➕ Extend"));
  assert.ok(detailLabels.includes("⬆️ Promote"));
  assert.ok(detailLabels.includes("⏸ Suspend"));

  const durationLabels = labels(buildSubscriptionDurationKeyboard(ctx()));
  assert.deepEqual(durationLabels, ["7 days", "30 days", "90 days", "365 days", "✍️ Type Custom Days", "Cancel", "Back"]);

  const confirmLabels = labels(buildUserConfirmKeyboard(ctx(), { action: "promote" }));
  assert.ok(confirmLabels.includes("✅ Confirm"));
  assert.ok(confirmLabels.includes("🕒 Change Days"));

  const suspendLabels = labels(buildUserConfirmKeyboard(ctx(), { action: "suspend" }));
  assert.ok(suspendLabels.includes("✅ Confirm"));
  assert.equal(suspendLabels.includes("🕒 Change Days"), false);
});

test("all generated inline callback actions have router coverage", async () => {
  const service = searchServices("paypal")[0];
  const invoiceList = buildPayPalListKeyboard(
    ctx(),
    "invoice",
    [{ key: "inv_1", label: "Invoice 1" }],
    { page: 2, has_next_page: true },
    { page: 2, status: "ALL" },
  );
  const payoutList = buildPayPalListKeyboard(
    ctx(),
    "payout",
    [{ key: "po_1", label: "Payout 1" }],
    { page: 2, has_next_page: true },
    { page: 2, status: "ALL", providerState: "ALL" },
  );
  const user = { telegram_id: 123, username: "alice", role: ROLES.USER, status: STATUS.ACTIVE };
  const actionSet = new Set([
    ...callbackActions(buildStartKeyboard(ctx(), { role: ROLES.OWNER, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: true, isOwner: true })),
    ...callbackActions(buildMainMenuKeyboard(ctx(), { role: ROLES.OWNER, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: true, isOwner: true })),
    ...callbackActions(buildMainMenuKeyboard(ctx(), { role: ROLES.USER, status: STATUS.ACTIVE, isAuthorized: true })),
    ...callbackActions(buildServiceGroupsKeyboard(ctx())),
    ...callbackActions(buildServiceSearchResultsKeyboard(ctx(), [service])),
    ...callbackActions(buildPayPalWorkspaceKeyboard(ctx(), { role: ROLES.ADMIN, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: true })),
    ...callbackActions(invoiceList),
    ...callbackActions(payoutList),
    ...callbackActions(buildInvoiceResultKeyboard(ctx(), "inv_1")),
    ...callbackActions(buildPayoutResultKeyboard(ctx(), "po_1")),
    ...callbackActions(buildUsersKeyboard(ctx())),
    ...callbackActions(buildUsersListKeyboard(ctx(), [user])),
    ...callbackActions(buildUserDetailKeyboard(ctx(), user)),
    ...callbackActions(buildUsersAuditKeyboard(ctx())),
    ...callbackActions(buildPaymentAuditKeyboard(ctx())),
    ...callbackActions(buildBotAnalyticsKeyboard(ctx())),
    ...callbackActions(buildSubscriptionAlertsKeyboard(ctx())),
    ...callbackActions(buildSubscriptionDurationKeyboard(ctx())),
    ...callbackActions(buildUserConfirmKeyboard(ctx(), { action: "promote" })),
  ]);
  actionSet.delete("BACK");

  const calls = [];
  const handlers = new Proxy({
    getService: () => service,
  }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return async (...args) => {
        calls.push([String(prop), args]);
      };
    },
  });
  const deps = {
    requireAdmin: async () => true,
    handlers,
  };

  const uncovered = [];
  for (const action of actionSet) {
    const handled =
      await handleServiceCallback(ctx(), action, deps) ||
      await handlePaymentCallback(ctx(), action, deps) ||
      await handleUserCallback(ctx(), action, deps) ||
      await handlePublicCallback(ctx(), action, deps);
    if (!handled) uncovered.push(action);
  }

  assert.deepEqual(uncovered, []);
  assert.ok(calls.length > 0);
});

test("back navigation uses the saved previous screen", () => {
  const fakeCtx = ctx();
  resetNavigation(fakeCtx, "MENU");
  rememberScreen(fakeCtx, "WHOAMI");
  assert.equal(popBackAction(fakeCtx), "MENU");

  const backLabels = labels(buildBackKeyboard(fakeCtx));
  assert.deepEqual(backLabels, ["⬅️ Back", "🏠 Main Menu"]);
});

test("parent inline routes replace child screens in the navigation stack", () => {
  const serviceCtx = ctx();
  resetNavigation(serviceCtx, "MENU");
  rememberScreen(serviceCtx, "SERVICES");
  rememberScreen(serviceCtx, "GROUP:FLASH");
  rememberScreen(serviceCtx, "SERVICE:paypal");
  prepareNavigationAction(serviceCtx, "GROUP:FLASH");
  rememberScreen(serviceCtx, "GROUP:FLASH");
  assert.equal(popBackAction(serviceCtx), "SERVICES");

  const paypalCtx = ctx();
  resetNavigation(paypalCtx, "MENU");
  rememberScreen(paypalCtx, "SERVICE:paypal");
  rememberScreen(paypalCtx, "PP:HOME");
  rememberScreen(paypalCtx, "PP:INV");
  rememberScreen(paypalCtx, "PP:INV_D:inv_1");
  prepareNavigationAction(paypalCtx, "PP:INV");
  rememberScreen(paypalCtx, "PP:INV");
  assert.equal(popBackAction(paypalCtx), "PP:HOME");

  prepareNavigationAction(paypalCtx, "PP:HOME");
  rememberScreen(paypalCtx, "PP:HOME");
  assert.equal(popBackAction(paypalCtx), "SERVICE:paypal");
});

test("stale callback recovery opens the closest fresh workspace", () => {
  const owner = { role: ROLES.OWNER, status: STATUS.ACTIVE, isAuthorized: true, isAdmin: true, isOwner: true };
  assert.ok(labels(buildCallbackRecoveryKeyboard(ctx(), "USER_D:123", owner)).includes("📋 List Users"));
  assert.ok(labels(buildCallbackRecoveryKeyboard(ctx(), "PP:INV_D:inv_1", owner)).includes("📄 Official Invoices"));
  assert.ok(labels(buildCallbackRecoveryKeyboard(ctx(), "SERVICE:paypal", owner)).includes("Bank Slips"));
});

test("payment duplicate guards block unsafe repeated actions", () => {
  assert.equal(invoiceReleaseGuard({ status: "RELEASED" }), "This invoice already appears to have released funds.");
  assert.equal(invoiceReleaseGuard({ status: "SENT" }), "Invoice status SENT is not releaseable from Telegram.");
  assert.equal(invoiceReleaseGuard({ status: "PAID" }), null);

  assert.equal(payoutActionGuard({ status: "APPROVED" }, "approve"), "This payout is already approved or processing.");
  assert.equal(payoutActionGuard({ status: "REJECTED" }, "reject"), "This payout has already been rejected.");
  assert.equal(
    payoutActionGuard({ status: "PENDING_APPROVAL", official_paypal: { provider_item_status: "SUCCESS" } }, "cancel"),
    "Provider state SUCCESS is not eligible for unclaimed cancellation.",
  );
  assert.equal(payoutActionGuard({ status: "PENDING_APPROVAL", official_paypal: { provider_item_status: "UNCLAIMED" } }, "cancel"), null);
});
