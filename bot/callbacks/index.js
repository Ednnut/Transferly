const { handlePublicCallback } = require("./public");
const { handleServiceCallback } = require("./services");
const { handlePaymentCallback } = require("./payments");
const { handleUserCallback } = require("./users");

function registerCallbackRouter(bot, deps) {
  bot.on("callback_query:data", deps.wrap(async (ctx) => {
    const validation = deps.validateCallback(ctx, ctx.callbackQuery.data);
    if (validation.status !== "ok") {
      await ctx.answerCallbackQuery({ text: "This menu expired. Use /menu.", show_alert: false });
      await deps.deleteOrDisableMessage(
        ctx,
        ctx.callbackQuery.message?.chat?.id,
        ctx.callbackQuery.message?.message_id,
      );
      await deps.recoverCallback?.(ctx, validation);
      return;
    }

    const action = validation.action;
    await ctx.answerCallbackQuery();

    if (action === "BACK") {
      await deps.handlers.handleBack(ctx);
      return;
    }

    const requiredCapability = deps.getActionCapability(action);
    if (!(await deps.requireCapability(ctx, requiredCapability, action.toLowerCase()))) {
      return;
    }

    deps.prepareNavigationAction?.(ctx, action);
    deps.recordAnalytics?.(ctx, action, "callback");

    if (await handleServiceCallback(ctx, action, deps)) return;
    if (await handlePaymentCallback(ctx, action, deps)) return;
    if (await handleUserCallback(ctx, action, deps)) return;
    if (await handlePublicCallback(ctx, action, deps)) return;

    await deps.replyHtml(ctx, "Unknown Transferly action. Use /menu to start again.", deps.buildBackKeyboard(ctx));
  }, "callback"));
}

module.exports = {
  registerCallbackRouter,
};
