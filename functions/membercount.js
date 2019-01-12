module.exports = (bot) => {

  let countRefresh = async function (guild) {
    let settings = bot.guildsettings[guild.id].membercount;

    if (!settings) {
      return;
    }

    for (let i in settings.channels) {
      let channel = settings.channels[i];
      if (channel.channel && channel.channel.type === 2) {
        let string = channel.string;

        string = string.replace(/%t/, settings.counts.humans + settings.counts.bots);
        string = string.replace(/%h/, settings.counts.humans);
        string = string.replace(/%b/, settings.counts.bots);

        let channelObj = guild.channels.get(channel.channel.id);

        if (channelObj) {
          channelObj.edit({
            name: string
          }, "Member count").catch((err) => {
            console.log(err);
          });
        } else {
          // bot.guildsettings[guild.id].membercount.channels[i].channel = null;
        }
      }
    }
  };

  let auditMembers = function (guild) {
    let settings = bot.guildsettings[guild.id].membercount;

    if (!settings) {
      return;
    }

    settings.counts = {
      bots: 0,
      humans: 0
    };

    guild.members.forEach((member) => {
      if (member.bot) {
        settings.counts.bots += 1;
      } else {
        settings.counts.humans += 1;
      }
    });

    bot.guildsettings[guild.id].membercount = settings;
  };

  bot.on("guildMemberRemove", (guild, member) => {
    if (member.bot) {
      bot.guildsettings[guild.id].membercount.counts.bot -= 1;
    } else {
      bot.guildsettings[guild.id].membercount.counts.humans -= 1;
    }

    countRefresh(guild);
  });

  bot.on("guildMemberAdd", (guild, member) => {
    if (member.bot) {
      bot.guildsettings[guild.id].membercount.counts.bot += 1;
    } else {
      bot.guildsettings[guild.id].membercount.counts.humans += 1;
    }

    countRefresh(guild);
  });

  bot.guilds.forEach((guild) => {
      auditMembers(guild);
      countRefresh(guild);
  });

  bot.registerCommand({
    name: "mc",
    category: "guild",
    info: {
      args: "[what i do]",
      description: "member count\n[setup]"
    },
    generator: async (msg, args) => {
      if (!bot.checkPerm(msg, "manageChannels")) {
        return;
      }

      let guild = msg.channel.guild;
      let settings = bot.guildsettings[guild.id].membercount;
      let temp;
      let edit;

      temp = args[0] ? args[0].toLowerCase() : await bot.prompt(msg, "wyd ?", [
        "setup",
        "edit",
        "refresh"
      ]);

      switch (temp) {
        case "setup":
          temp = (settings.channels.mccategory.channel ? guild.channels.get(settings.channels.mccategory.channel.id) : null) || await guild.createChannel("Stats", 4, "Member count");
          settings.channels.mccategory.channel = temp;

          temp = (settings.channels.mctotal.channel ? guild.channels.get(settings.channels.mctotal.channel.id) : null) || await guild.createChannel("Total count", 2, "Member count", settings.channels.mccategory.channel.id);

          settings.channels.mctotal.channel = temp;

          temp = (settings.channels.mchuman.channel ? guild.channels.get(settings.channels.mchuman.channel.id) : null) || await guild.createChannel("Human count", 2, "Member count", settings.channels.mccategory.channel.id);

          settings.channels.mchuman.channel = temp;

          temp = (settings.channels.mcbot.channel ? guild.channels.get(settings.channels.mcbot.channel.id) : null) || await guild.createChannel("Bot count", 2, "Member count", settings.channels.mccategory.channel.id);
          settings.channels.mcbot.channel = temp;

          for (let i in settings.channels) {
            let channel = settings.channels[i].channel;
            channel.editPermission(bot.user.id, 0x00100000, 0, "member", "Member count");
            channel.editPermission(guild.id, 0, 0x00100000, "role", "Member count");
          }

          bot.guildsettings[msg.channel.guild.id].membercount = settings;

          auditMembers(guild);
          countRefresh(guild);
          bot.send(msg, "done");
        break;
        case "edit":
          edit = args[1] ? args[1].toLowerCase() : await bot.prompt(msg, "`total`, `bot`, `human` ?", [
            "total",
            "bot",
            "human"
          ]);
          switch (edit) {
            case "total":
            case "bot":
            case "human":
              temp = args[2] ? bot._.drop(args, 2).join(" ") : await bot.prompt(msg, {
                  title: "set it to?",
                  description: "give me a title with a variable:\n" +
                  "```js\n" +
                  "total: '%t'\n" +
                  "humans: '%h'\n" +
                  "bots: '%b'```\n" +
                  "example: `Member Count: %m`"
                });
              if (temp === "") {
                bot.send(
                  msg, "you didnt tell me what to set it to",
                  "give me a title with a variable:\n" +
                  "```js\n" +
                  "total: '%t'\n" +
                  "humans: '%h'\n" +
                  "bots: '%b'```\n" +
                  "example: `Member Count: %m`"
                  );
              } else if (temp.length > 2 && temp.length < 95) {
                bot._.set(settings, `channels.mc${edit.toLowerCase()}.string`, temp);
                bot.guildsettings[guild.id].membercount = settings;
                countRefresh(guild);
              } else {
                bot.send(msg, `\`${temp}\` is a shitty title, try again.`);
              }

              bot.send(msg, "done");
            break;
            default:
              bot.send(msg, "sets an mc channel's title\nchoose: `total`, `bot`, `human` ?");
            break;
          }
        break;

        case "refresh":
          auditMembers(guild);
          countRefresh(guild);
          bot.send(msg, "done");
        break;

        default:
          bot.send(msg, "`setup`, `edit`, `refresh` ?");
        break;
      }
    }
  });
};