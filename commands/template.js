module.exports = (bot) => {
  bot.registerCommand({
    name: "template",
    category: "misc",
    info: {
      args: "[anything]",
      description: "does nothing"
    },
    generator: (msg, args) => {
      bot.send(msg, "aaaaaAAAAAAAA " + args.join(" "));
    }
  });
};