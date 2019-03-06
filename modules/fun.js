module.exports = (bot) => {
  // say command
  bot.registerCommand({
    name: "say",
    category: "bot owner",
    info: {
      args: "[anything]",
      description: "says"
    },
    generator: async (msg, args) => {
      let channel = msg.channel;

      if (args[0].match(/[0-9]{18}/)) {
        const channelid = args[0];
        const guildid = bot.channelGuildMap[channelid];
        const guild = bot.guilds.get(guildid);

        try {
          if (guild) {
            channel = guild.channels.get(channelid);
          } else {
            channel = await bot.users.get(channelid).getDMChannel();
          }
        } catch (err) {
          bot.send(msg, "invalid channel");
          return;
        }

        args.shift();

        bot.send(msg, {
          title: `said \`${args.join(" ")}\` in \`${(channel.name ? "#" + channel.name : "DM")}\` of \`${(guild ? guild.name : channel.recipient.username)}\``,
          url: guild ? "https://discordapp.com/channels/" + guild.id + "/" + channel.id : ""
        });
      } else {
        msg.delete().catch(() => {
          // fail
        });
      }
      channel.createMessage(args.join(" ")).catch(() => {
        // fail
      });
    }
  });

  // magic 8ball command
  let responses = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes - definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
  ];
  bot.registerCommand({
    name: "m8b",
    category: "fun",
    info: {
      args: "[question]",
      description: "magic 8 ball"
    },
    generator: (msg, args) => {
      bot.send(msg, "Magic 8ball", (args[0] ? `\`\`\`yaml\n${args.join(" ")}\`\`\`\n` : "") + `\`\`\`fix\n${responses[~~(Math.random() * responses.length)]}\`\`\``);
    }
  });

  // choose command
  bot.registerCommand({
    name: "choose",
    category: "fun",
    info: {
      args: "[options]",
      description: "choosie woosie"
    },
    generator: (msg, _args) => {
      let args = _args[0] ? _args : [
        "yes",
        "no"
      ];
      bot.send(msg, "Choose", `\`\`\`yaml\n"${args.join("\", \"")}"\`\`\`\n\`\`\`fix\n${args[~~(Math.random() * args.length)]}\`\`\``);
    }
  });

  // dad
  bot.on("messageCreate", (msg) => {
    if (!msg.channel.guild) {
      return;
    }

    if (!msg.author) {
      return;
    }

    if (msg.author.id === bot.user.id) {
      return;
    }

    if (!bot.guildData.get(msg.channel.guild.id, "dad")) {
      return;
    }

    let k = (/\b(i(?:'|"|‘|`|’)?m)\s(.+)/ig).exec(msg.content);

    if (k) {
      if (k[2].match(/^dad/i)) {
        bot.createMessage(msg.channel.id, "no, im dad.").catch(() => {
          // fail
        });
        return;
      }
      bot.createMessage(msg.channel.id, `hi ${k[2]}, i'm dad!`).catch(() => {
        // fail
      });
    }
  });

  bot.registerCommandConfigBool({
    name: "dad",
    verbose: "is dad awake?",
    setting: "dad",
    permission: "guild"
  });
};