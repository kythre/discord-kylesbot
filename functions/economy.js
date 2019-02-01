// global economy with guild economy features for some reason

module.exports = (bot) => {
  const moment = require("moment");

  // bot.registerCommandConfigInt({
  //   name: "setdaily",
  //   verbose: "amount for daily grabs",
  //   setting: "economy.daily",
  //   permission: "guild"
  // });

  bot.registerCommandConfigStr({
    name: "setcurrency",
    verbose: "set the plural currency you use",
    setting: "economy.currency",
    permission: "guild"
  });

  bot.commands.push(new bot.eris.Command("lb", (msg, args) => {
    const guildID = msg.channel.guild.id;
    const currency = bot.guildSettingsGet(guildID, "economy.currency") || "fucks";
    let lb = {};

    for (let a in bot.usersettings) {
      let value = bot._.get(bot.usersettings[a], "economy.value");
      if (value && bot.users.get(a)) {
        lb[bot.users.get(a).username + "#" + bot.users.get(a).discriminator] = value;
      }
    }

    lb = Object.entries(lb).sort((a, b) => b[1] - a[1]);

    const entriesPerPage = 10;
    let page = 0;
    let lastPage = Math.ceil(lb.length / entriesPerPage) - 1;

    if (args[0]) {
      if (args[0].match(/^[0-9]+$/)) {
        page = args[0] - 1;
      } else {
        lb.find((a, b) => {
          if (a[0].toLowerCase().includes(args[0].toLowerCase())) {
            page = Math.ceil(b / entriesPerPage);
            return a;
          }
        });
      }

      if (args[0] === "last") {
        page = lastPage;
      }
    }

    page = Math.min(lastPage, page);

    for (let i = 0; i < page * entriesPerPage; i++) {
      lb.shift();
    }

    while (lb.length > entriesPerPage) {
      lb.pop();
    }
    let num = page * entriesPerPage;
    lb = lb.map((e) => {
      num++;
      return {
        "name": `#${num} ${e[0]}`,
        "value": `${e[1]}${currency}`,
        "inline": false
      };
    });
    return bot.send(msg, `${currency} Leaderboard [Page ${page + 1}/${lastPage + 1}]`, {
      "fields": lb
    });
  }, {
    fullDescription: "shows the leaderboard",
    guildOnly: true,
    description: "economy"
  }));

  bot.commands.push(new bot.eris.Command("timely", (msg) => {
    // const oneDay = 8.64e+7;
    const oneHour = 3.6e+6;
    const userId = msg.author.id;
    const guildID = msg.channel.guild.id;
    const nextGet = (bot.userSettingsGet(userId, "economy.lastget") || 0) + oneHour * 2;
    const currency = bot.guildSettingsGet(guildID, "economy.currency") || "fucks";

    if (nextGet < Date.now()) {
      let worth = bot.userSettingsGet(userId, "economy.value") || 0;
      const guildDaily = bot.guildSettingsGet(guildID, "economy.daily") || 50;
      worth += guildDaily;

      bot.userSettingsSet(userId, "economy.lastget", Date.now());
      bot.userSettingsSet(userId, "economy.value", worth);
      return bot.send(msg, `take your ${guildDaily} ${currency}. now fuck outta here`);
    }
    return bot.send(msg, `${msg.author.username}, fuck off for ${moment.duration(nextGet - Date.now(), "milliseconds").humanize()}`);
  }, {
    fullDescription: "gives you your daily currency",
    guildOnly: true,
    description: "economy"
  }));

  bot.commands.push(new bot.eris.Command("worth", (msg) => {
    let userId = msg.author.id;
    let username = msg.author.username;

    if (msg.mentions[0] && msg.channel.guild.members.get(msg.mentions[0].id)) {
      userId = msg.mentions[0].id;
      username = msg.mentions[0].username;
    }

    const guildID = msg.channel.guild.id;
    const currency = bot.guildSettingsGet(guildID, "economy.currency") || "fucks";
    const worth = bot.userSettingsGet(userId, "economy.value");
    let message = `${username}. worthless.`;

    if (worth < 0) {
      return bot.send(msg, `wtf ${username} has ${worth}${currency}`, "are you retarded");
    }

    if (worth > 0) {
      message = `${username} has ${worth}${currency}`;
    }

    return bot.send(msg, message);
  }, {
    fullDescription: "how much ya worth?",
    guildOnly: true,
    description: "economy",
    aliases: [
      "$",
      "value"
    ]
  }));

  bot.commands.push(new bot.eris.Command("bf", (msg, args) => {
    const userId = msg.author.id;
    const guildID = msg.channel.guild.id;
    const currency = bot.guildSettingsGet(guildID, "economy.currency") || "fucks";
    const worth = bot.userSettingsGet(userId, "economy.value");

    if (args[0] && args[0].match(/^[0-9]+|(all)$/) && args[0] !== "0" && args[1] && args[1].match(/h|t/i)) {
      const betAmount = args[0] === "all" ? worth : parseInt(args[0], 10);
      const betOn = args[1] === "h";
      const outcome = Math.random() * 1000 <= 499;

      if (betAmount > worth && betAmount > 0) {
        return bot.send(msg, msg.author.username + " is too poor for this bet");
      }

      bot.userSettingsSet(userId, "economy.value", worth + (betAmount * (((outcome == betOn) * 2) - 1)));
      return bot.send(msg, `${msg.author.username} ${betOn == outcome ? "won" : "lost"} ${betAmount}${currency}`, {
        thumbnail: {
          url: outcome ? "https://cdn.discordapp.com/attachments/518474827833540618/538962066174902294/3a685ce5a4c342e2b173067628c99138.png" : "https://cdn.discordapp.com/attachments/518474827833540618/538961544415936533/British_two_pence_coin_2015_reverse.png"
        }
      });
    }

    return bot.send(msg, msg.author.username + " is dumb");
  }, {
    fullDescription: "how much ya worth?",
    guildOnly: true,
    description: "economy"
  }));

  bot.commands.push(new bot.eris.Command("give", (msg, args) => {
    const userId = msg.author.id;
    const guildID = msg.channel.guild.id;
    const currency = bot.guildSettingsGet(guildID, "economy.currency") || "fucks";
    const giverWorth = bot.userSettingsGet(userId, "economy.value");

    if (msg.mentions[0] && !msg.mentions[0].bot) {
      if (msg.channel.guild.members.get(msg.mentions[0].id)) {
        const recipientID = msg.mentions[0].id;
        if (args[0] && args[0].match(/^[0-9]+|(all)$/)) {
          const giveAmount = args[0] === "all" ? giverWorth : parseInt(args[0], 10);

          if (giveAmount > giverWorth) {
            return bot.send(msg, msg.author.username + ", the fuck are you trying to give them you brokeass mf");
          }

          const recipientWorth = bot.userSettingsGet(recipientID, "economy.value");

          bot.userSettingsSet(userId, "economy.value", giverWorth - giveAmount);
          bot.userSettingsSet(recipientID, "economy.value", recipientWorth + giveAmount);

          return bot.send(msg, `${msg.author.username} gave some ${giveAmount}${currency} to ${msg.mentions[0].username}`);
        }
      }
    }
    return bot.send(msg, msg.author.username + ", ya dumb");
  }, {
    fullDescription: "gimme ya money",
    guildOnly: true,
    description: "economy"
  }));
};