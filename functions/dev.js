module.exports = (bot) => {
  const util = require("util");

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
        delete evaled.stack;
      }

      evaled = util.inspect(evaled, {
        depth: 1,
        sorted: true,
        breakLength: 100
      });

      evaled.replace(/`/g, "`" + String.fromCharCode(8203));

      for (let i in bot.secret) {
        evaled = evaled.replace(bot.secret[i], "👀");
      }

      if (evaled.length > 1024) {
        evaled = evaled.substring(0, 1012) + "...";
      }

      return bot.send(msg, "eval", {
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

  bot.registerCommand({
    name: "save",
    category: "bot owner",
    info: {
      args: "none",
      description: "saves data"
    },
    generator: async (msg) => {
      await bot.save();
      bot.send(msg, "save done");
    }
  });

  bot.registerCommand({
    name: "settings",
    category: "guild",
    info: {
      args: "depth",
      description: "echos guild settings"
    },
    generator: async (msg, args) => {
      let settings;

      if (args[0]) {
        settings = bot._.get(bot.guildsettings[msg.channel.guild.id], args[0]);
      } else {
        settings = bot.guildsettings[msg.channel.guild.id];
      }

      bot.send(msg, "guild settings", "```js\n" + util.inspect(settings, {
        depth: 1,
        sorted: true,
        breakLength: 10
      }) + "```");
    }
  });
};