module.exports = (bot) => {
  bot.registerCommand({
    name: "eval",
    category: "bot owner",
    info: {
      args: "[code]",
      description: "runs ur code"
    },
    generator: async (msg, args) => {
      let input = " " + args.join(" ");
      let evaled;

      try {
        evaled = eval(input);
      } catch (err) {
        evaled = err;
      }

      evaled = require("util").inspect(evaled);

      evaled.replace(/`/g, "`" + String.fromCharCode(8203));

      for (let i in bot.secret) {
        evaled = evaled.replace(bot.secret[i], "👀");
      }

      if (evaled.length > 1024) {
        evaled = evaled.substring(0, 1012) + "...";
      }

      return bot.send(msg, {
        color: bot.color,
        fields: [
          {
            name: "Input:",
            value: `\`\`\`js\n${input}\`\`\``,
            inline: false
          },
          {
            name: "Output:",
            value: `\`\`\`js\n${evaled}\`\`\``,
            inline: false
          }
        ]
      });
    }
  });
};