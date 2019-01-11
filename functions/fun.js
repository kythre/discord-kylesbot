module.exports = (bot) => {
  bot.registerCommand({
    name: "say",
    category: "fun",
    info: {
      args: "[anything]",
      description: "does nothing"
    },
    generator: (msg, args) => {
      msg.delete().catch(() => {
        // fail
      });
      msg.channel.createMessage(args.join(" ")).catch(() => {
        // fail
      });
    }
  });
};