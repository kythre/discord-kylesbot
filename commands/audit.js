module.exports = (bot) => {
  bot.registerCommand({
    name: "audit",
    category: "bot owner",
    info: {
      args: "none",
      description: "audits all command files"
    },
    generator: async (msg) => {
      bot.commands = {};
      bot.commandsOrganized = {};
      await bot.audit();
      bot.send(msg, "done");
    }
  });
};