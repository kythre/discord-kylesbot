// global economy with guild economy features for some reason

module.exports = (bot) => {
  const moment = require("moment");

  // bot.registerCommandConfigInt({
  //   name: "setdaily",
  //   verbose: "amount for daily grabs",
  //   setting: "economy.daily",
  //   permission: "guild"
  // });

  // trans_ = {
  //   to: userID,
  //   from: userID,
  //   method: "how",
  //   resason: "why"
  // }

  const transact = function (trans_) {
    if (!trans_.to && !trans_.from) {
      throw new Error("failed transfer, no users given");
    }

    if (!trans_.amount || trans_.amount < 0) {
      throw new Error("failed transfer, invalid amount");
    }

    if (!trans_.method) {
      throw new Error("failed transfer, no method given");
    }

    if (trans_.to) {
      const worth = bot.userData.get(trans_.to, "economy.value");
      bot.userData.set(trans_.to, "economy.value", worth + trans_.amount);
      bot.userData.set(trans_.to, [
        "economy",
        "transactions",
         Date.now().toString()
      ], trans_);
    }

    if (trans_.from) {
      trans_.amount *= -1;
      const worth = bot.userData.get(trans_.from, "economy.value");
      bot.userData.set(trans_.from, "economy.value", worth + trans_.amount);
      bot.userData.set(trans_.from, [
        "economy",
        "transactions",
         Date.now().toString()
      ], trans_);
    }
  };

  bot.registerCommandConfigStr({
    name: "setcurrency",
    verbose: "set the plural currency you use",
    setting: "economy.currency",
    permission: "guild"
  });

  const lb = function (guildID, page_ = 1) {
    const currency = bot.guildData.get(guildID, "economy.currency") || "fucks";
    const entriesPerPage = 10;
    let page = page_;
    let fields = {};

    // populate fields with valid entries
    for (let uid in bot.userData.raw) {
      let value = bot._.get(bot.userData.raw[uid], "economy.value");
      if (value && bot.users.get(uid)) {
        fields[bot.users.get(uid).username + "#" + bot.users.get(uid).discriminator] = value;
      }
    }

    // sort entries from greatest to least, by the second value (amount of currency)
    fields = Object.entries(fields).sort((a, b) => b[1] - a[1]);

    // round up to the highest page, then subtract 1 becase we count from 0
    const lastPage = Math.ceil(fields.length / entriesPerPage) - 1;

    if (typeof page === "number" || page.match(/^[0-9]+$/)) {
      // subtract 1 as we count from 0
      page -= 1;
      page = Math.max(0, page);
      page = Math.min(lastPage, page);
    } else if (page === "l") {
      page = lastPage;
    } else {
      // if our "page" is a string then find where that string appears in the entries and use that page
      fields.find((a, b) => {
        if (a[0].toLowerCase().includes(page.toLowerCase())) {
          page = Math.ceil(b / entriesPerPage);
          return a;
        }
      });
    }

    // remvoe all entries leading up to our page
    for (let i = 0; i < page * entriesPerPage; i++) {
      fields.shift();
    }

    // remove all entries more than our page limit
    while (fields.length > entriesPerPage) {
      fields.pop();
    }

    let num = page * entriesPerPage;
    fields = fields.map((e) => {
      num++;
      return {
        "name": `#${num} \`${e[0]}\``,
        "value": `${e[1]}${currency}`,
        "inline": false
      };
    });

    return [
      {
        "description": `${currency} Leaderboard [Page ${page + 1}/${lastPage + 1}]`,
        fields
      },
      page + 1
    ];
  };

  bot.reactionActions.lbpage = (msg, action, userID) => {
    msg.removeReaction(action.emoji, userID).catch(() => {
      // catch
    });

    if (action.response === "+") {
      msg.page++;
    } else if (action.response === "-") {
      msg.page--;
    }

    const [
      embed,
      page
    ] = lb(msg.channel.guild.id, msg.page);
    msg.channel.messages.get(msg.id).page = page;
    bot.edit(msg, embed);
  };

  bot.registerCommand("lb", async (msg, args) => {
    const [
      embed,
      page
    ] = lb(msg.channel.guild.id, args[0]);
    let m = await bot.send(msg, embed);
    msg.channel.messages.get(m.id).page = page;
    return m;
  }, {
    fullDescription: "shows the leaderboard",
    guildOnly: true,
    description: "economy",
    reactionButtons: [
      {
        emoji: "👈",
        type: "lbpage",
        response: "-"
      },
      {
        emoji: "👉",
        type: "lbpage",
        response: "+"
      }
  ],
  reactionButtonTimeout: 60000
  });

  bot.registerCommand("timely", (msg) => {
    // const oneDay = 8.64e+7;
    const oneHour = 3.6e+6;
    const userID = msg.author.id;
    const guildID = msg.channel.guild.id;
    const nextGet = (bot.userData.get(userID, "economy.lastget") || 0) + oneHour * 2;
    const currency = bot.guildData.get(guildID, "economy.currency") || "fucks";

    if (nextGet < Date.now()) {
      const guildDaily = bot.guildData.get(guildID, "economy.daily") || 50;
      transact({
        to: userID,
        amount: guildDaily,
        method: "timely"
      });
      bot.userData.set(userID, "economy.lastget", Date.now());
      return bot.send(msg, `take your ${guildDaily} ${currency}. now fuck outta here`);
    }
    return bot.send(msg, `${msg.author.username}, fuck off for ${moment.duration(nextGet - Date.now(), "milliseconds").humanize()}`);
  }, {
    fullDescription: "gives you your daily currency",
    guildOnly: true,
    description: "economy"
  });

  bot.registerCommand("worth", (msg) => {
    let userId = msg.author.id;
    let username = msg.author.username;

    if (msg.mentions[0] && msg.channel.guild.members.get(msg.mentions[0].id)) {
      userId = msg.mentions[0].id;
      username = msg.mentions[0].username;
    }

    const guildID = msg.channel.guild.id;
    const currency = bot.guildData.get(guildID, "economy.currency") || "fucks";
    const worth = bot.userData.get(userId, "economy.value");
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
  });

  bot.registerCommand("bf", (msg, args) => {
    const userID = msg.author.id;
    const guildID = msg.channel.guild.id;
    const currency = bot.guildData.get(guildID, "economy.currency") || "fucks";
    const worth = bot.userData.get(userID, "economy.value");

    if (args[0] && args[0].match(/^[0-9]+|(all)$/) && args[0] !== "0" && args[1] && args[1].match(/h|t/i)) {
      const betAmount = args[0] === "all" ? worth : parseInt(args[0], 10);
      const betOn = args[1] === "h";
      const coin = Date.now() % 2;
      const outcome = betOn == coin;

      if (betAmount > worth && betAmount > 0) {
        return bot.send(msg, msg.author.username + " is too poor for this bet");
      }

      if (outcome) {
        transact({
          to: userID,
          amount: betAmount,
          method: "betflip"
        });
      } else {
        transact({
          from: userID,
          amount: betAmount,
          method: "betflip"
        });
      }

      return bot.send(msg, `${msg.author.username} ${outcome ? "won" : "lost"} ${betAmount}${currency}`, {
        thumbnail: {
          url: coin ? "https://cdn.discordapp.com/attachments/518474827833540618/538962066174902294/3a685ce5a4c342e2b173067628c99138.png" : "https://cdn.discordapp.com/attachments/518474827833540618/538961544415936533/British_two_pence_coin_2015_reverse.png"
        }
      });
    }

    return bot.send(msg, msg.author.username + " is dumb");
  }, {
    fullDescription: "how much ya worth?",
    guildOnly: true,
    description: "economy"
  });

  bot.registerCommand("give", (msg, args) => {
    const userID = msg.author.id;
    const guildID = msg.channel.guild.id;
    const currency = bot.guildData.get(guildID, "economy.currency") || "fucks";
    const giverWorth = bot.userData.get(userID, "economy.value");

    if (msg.mentions[0] && !msg.mentions[0].bot) {
      if (msg.channel.guild.members.get(msg.mentions[0].id)) {
        const recipientID = msg.mentions[0].id;
        if (args[0] && args[0].match(/^[0-9]+|(all)$/)) {
          const giveAmount = args[0] === "all" ? giverWorth : parseInt(args[0], 10);

          if (giveAmount > giverWorth) {
            return bot.send(msg, msg.author.username + ", the fuck are you trying to give them you brokeass mf");
          }

          let reason = args;
          reason.shift();
          reason.shift();
          reason.join(" ");

          transact({
            to: recipientID,
            from: userID,
            amount: giveAmount,
            method: "give",
            reason
          });

          return bot.send(msg, `${msg.author.username} gave some ${giveAmount}${currency} to ${msg.mentions[0].username}\n\`\`\`${reason}\`\`\``);
        }
      }
    }
    return bot.send(msg, msg.author.username + ", ya dumb");
  }, {
    fullDescription: "gimme ya money",
    guildOnly: true,
    description: "economy"
  });
};