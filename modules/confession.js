module.exports = async (bot) => {

  bot.registerCommand("cc", (msg) => {
    const guildID = msg.channel.guild.id;
    const channel = msg.channel;
    const confessCode = Math.random().toString(36).substring(7);

    bot.globalData.set("confession", [
      confessCode,
      "channel"
    ], channel.id);

    channel.edit({
      topic: `confess in bot dms with \`k!confess ${confessCode}\``
    }, "confession");
    channel.editPermission(guildID, 0, 2048, "role", "confession");
    channel.editPermission(bot.user.id, 2048, 0, "member", "confession");

    bot.send(msg, "confession", `confess in bot dms with \`k!confess ${confessCode} [confession]\``);
  }, {
    fullDescription: "set up a confession channel",
    guildOnly: true,
    description: "confession",
    requirements: {
      permissions: {
        "manageGuild": true
      }
    }
  });

  bot.registerCommand("confess", async (msg, args) => {
    const confessCode = args[0];
    const confessChannel = bot.globalData.get("confession", [
      confessCode,
      "channel"
    ]);

    if (!confessChannel) {
      bot.send(msg, "invalid code");
      return;
    }

    args.shift();
    const confession = args.join(" ");

    if (confession.lenth < 3) {
      bot.send(msg, "invalid confession");
      return;
    }

    let nmsg;

    if (false && confession.match(/(\[reveal\])/ig)) {
      nmsg = await bot.send(confessChannel, {
        author: {
          name: msg.author.username,
          icon_url: `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
        },
        description: confession,
        footer: {
          text: "confession"
        }
      });
    } else {
      nmsg = await bot.send(confessChannel, {
        author: {
          name: "Unknown",
          icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        description: confession,
        footer: {
          text: "confession"
        }
      });
    }

    nmsg.command = msg.command;

    bot.globalData.set("confession", [
      confessCode,
      "confession",
      nmsg.id
    ], [
      msg.author.id,
      confession
    ]);

    bot.send(msg, "your confession has been sent");
  }, {
    fullDescription: "confess to a confession channel",
    dmOnly: true,
    description: "confession"
  });

  // bot.registerCommand("reveal", async (msg, args) => {
  //   const confessChannel = Object.entries(bot.globalData.get("confession")).find((o) => o[1].channel === msg.channel.id)[1];
  //   const confession = confessChannel.confession[args[0]];
  //   if (confession) {
  //     if (confession[0] !== msg.author.id && msg.author.id !== bot.owner) {
  //       bot.send(msg, "you cant reveal someone else's confession");
  //       return;
  //     }

  //     const confessor = bot.users.get(confession[0]);
  //     bot.edit({
  //       id: args[0],
  //       channel: {
  //         id: msg.channel.id
  //       }
  //     }, {
  //       description: confession[1],
  //       author: {
  //         name: confessor.username,
  //         icon_url: `https://cdn.discordapp.com/avatars/${confessor.id}/${confessor.avatar}.png`
  //         }
  //     });
  //   } else {
  //     bot.send(msg, "confession not found");
  //   }
  //   msg.delete();
  // }, {
  //   fullDescription: "confess to a confession channel",
  //   guildOnly: true,
  //   description: "confession"
  // });
};