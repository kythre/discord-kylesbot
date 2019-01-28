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

  // reverse the message content
  bot.reactionActions.reverse = (msg, action, userID) => {
    msg.removeReaction(action.emoji, userID).catch(() => {
      // catch
    });

    const resp = msg.content.split("").reverse().join("");
    if (resp !== null) {
        bot.editMessage(msg.channel.id, msg.id, resp);
    }
  };

  bot.commands.push(new bot.eris.Command("test", (msg, args) => bot.send(msg, "aaaaaAAAAAAAA " + args.join(" ")), {
    description: "does nothing",
    cooldownMessage: "calm down faggot",
    cooldown: 10000,
    // add reaction buttons to the command
    reactionButtons: [
      {
          emoji: "⬅",
          type: "reverse",
          response: ""
      },
      // pick a new pong variation
      {
          emoji: "🔁",
          type: "edit",
          response: [
            "Pang!",
            "Peng!",
            "Ping!",
            "Pong!",
            "Pung!"
          ]
      },
      // stop listening for reactions
      {
          emoji: "⏹",
          type: "cancel"
      },
      {
        emoji: "💋",
        type: "role",
        response: "509798174790123528"
      }
  ],
  reactionButtonTimeout: -1

  }));
};