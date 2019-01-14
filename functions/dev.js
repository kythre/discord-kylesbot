module.exports = (bot) => {
  const util = require("util");
  const moment = require("moment");

  // eval command
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
        breakLength: 200
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

  // save command
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

  // guild settings echo command
  bot.registerCommand({
    name: "gsettings",
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

  // user settings echo command
  bot.registerCommand({
    name: "usettings",
    category: "user",
    info: {
      args: "depth",
      description: "echos user settings"
    },
    generator: async (msg, args) => {
      let settings;

      if (args[0]) {
        settings = bot._.get(bot.usersettings[msg.author.id], args[0]);
      } else {
        settings = bot.usersettings[msg.author.id];
      }

      bot.send(msg, "guild settings", "```js\n" + util.inspect(settings, {
        depth: 1,
        sorted: true,
        breakLength: 10
      }) + "```");
    }
  });

  // ping command
  bot.registerCommand({
    name: "ping",
    category: "misc",
    info: {
      args: "[none]",
      description: "ping pong"
    },
    generator: (msg) => {
      bot.send(msg, "Pong", `\`${Date.now() - msg.timestamp} ms\``);
    }
  });

  // stats command
  bot.registerCommand({
    name: "stats",
    category: "misc",
    info: {
      args: "[none]",
      description: "whats up doc"
    },
    generator: (msg) => {
      bot.send(
      msg, "Bot Stats",
      `• Ping: \`${Date.now() - msg.timestamp}ms\`\n` +
      `• Uptime: \`${moment.duration(bot.uptime, "milliseconds").humanize()}\`\n` +
      `• Servers: \`${bot.guilds.size}\`\n` +
      `• Members: \`${bot.users.size}\`\n` +
      `• Memory RSS: \`${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB\`\n` +
      `• Memory Heap: \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB\`\n` +
      `• Memory External: \`${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB\``
      );
    }
  });
};