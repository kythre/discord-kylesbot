module.exports = (bot) => {
  bot.registerCommand({
    name: "save",
    category: "bot owner",
    info: {
      args: "none",
      description: "saves data"
    },
    generator: async (msg) => {
      await bot.save();
      bot.send(msg, "done");
    }
  });
};