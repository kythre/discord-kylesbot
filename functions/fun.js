module.exports = (bot) => {
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

  bot.registerCommand({
    name: "choose",
    category: "fun",
    info: {
      args: "[options]",
      description: "choosie woosie"
    },
    generator: (msg, args) => {
      bot.send(msg, "Choose", (args[0] ? `\`\`\`js\n"${args.join(", ")}"\`\`\`\n` + args[~~(Math.random() * args.length)] : "fuck"));
    }
  });
};