module.exports = (bot) => {
  // say command
  bot.registerCommand({
    name: "say",
    category: "fun",
    info: {
      args: "[anything]",
      description: "says"
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
      bot.send(msg, "Magic 8ball", (args[0] ? `\`\`\`js\n"${args.join(" ")}"\`\`\`\n` : "") + `${responses[~~(Math.random() * responses.length)]}`);
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
    generator: (msg, args) => {
      bot.send(msg, "Choose", args[0] ? `\`\`\`js\n"${args.join(", ")}"\`\`\`\n` + args[~~(Math.random() * args.length)] : "yes");
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

    if (!bot.guildSettingsGet(msg.channel.guild.id, "dad")) {
      return;
    }

    let k = (/\b(im|i'm|i`m|i‘m)\s(.+)/ig).exec(msg.content);

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