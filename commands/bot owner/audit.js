/**
 * Audits commands (Owner only).
 */
exports.info = {
  usage: "audit",
  args: "none",
  description: "audits all command files"
};

exports.run = async function (bot, msg) {
  bot.commands = {};
  bot.commandsOrganized = {};
  await bot.audit();
  bot.send(msg, "done");
};