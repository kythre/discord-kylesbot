module.exports = (bot) => {

  let countRefresh = async function (guild) {
    let settings = bot.guildSettings[guild.id].membercount;

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
          //bot.guildSettings[guild.id].membercount.channels[i].channel = null;
        }
      }
    }
  };

  let auditMembers = function (guild) {
    let settings = bot.guildSettings[guild.id].membercount;

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

    bot.guildSettings[guild.id].membercount = settings;
  };

  bot.on("guildMemberRemove", (guild, member) => {
    if (member.bot) {
      bot.guildSettings[guild.id].membercount.counts.bot -= 1;
    } else {
      bot.guildSettings[guild.id].membercount.counts.humans -= 1;
    }

    countRefresh(guild);
  });

  bot.on("guildMemberAdd", (guild, member) => {
    if (member.bot) {
      bot.guildSettings[guild.id].membercount.counts.bot += 1;
    } else {
      bot.guildSettings[guild.id].membercount.counts.humans += 1;
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
      let settings = bot.guildSettings[guild.id].membercount;
      let temp;

      settings = settings || {
        counts: {
          bots: 0,
          humans: 0
        },
        channels: {
          mcCategory: {
            channel: null
          },
          mCountTotal: {
            channel: null,
            string: "Members: %t"
          },
          mCountHuman: {
            channel: null,
            string: "Humans: %h"
          },
          mCountBot: {
            channel: null,
            string: "Bots: %b"
          }
        }
      };

      temp = args[0] ? args[0].toLowerCase() : await bot.prompt(msg, "wyd ?", [
        "setup",
        "set",
        "refresh"
      ]);

      switch (temp) {
        case "setup":
          temp = (settings.channels.mcCategory.channel ? guild.channels.get(settings.channels.mcCategory.channel.id) : null) || await guild.createChannel("Stats", 4, "Member count");
          settings.channels.mcCategory.channel = temp;

          temp = (settings.channels.mCountTotal.channel ? guild.channels.get(settings.channels.mCountTotal.channel.id) : null) || await guild.createChannel("Total count", 2, "Member count", settings.channels.mcCategory.channel.id);

          settings.channels.mCountTotal.channel = temp;

          temp = (settings.channels.mCountHuman.channel ? guild.channels.get(settings.channels.mCountHuman.channel.id) : null) || await guild.createChannel("Human count", 2, "Member count", settings.channels.mcCategory.channel.id);

          settings.channels.mCountHuman.channel = temp;

          temp = (settings.channels.mCountBot.channel ? guild.channels.get(settings.channels.mCountBot.channel.id) : null) || await guild.createChannel("Bot count", 2, "Member count", settings.channels.mcCategory.channel.id);
          settings.channels.mCountBot.channel = temp;

          for (let i in settings.channels) {
            let channel = settings.channels[i].channel;
            channel.editPermission(bot.user.id, 0x00100000, 0, "member", "Member count");
            channel.editPermission(guild.id, 0, 0x00100000, "role", "Member count");
          }

          bot.guildSettings[msg.channel.guild.id].membercount = settings;

          auditMembers(guild);
          countRefresh(guild);
        break;

        case "set":
          temp = args[1] ? args[1].toLowerCase() : await bot.prompt(msg, "`total`, `bot`, `human` ?", [
            "total",
            "bot",
            "human"
          ]);
          switch (temp) {
            case "total":
            case "bot":
            case "human":
              temp = bot._.drop(args, 2).join(" ");
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
                bot._.set(settings, `channels.mCount${bot._.capitalize(args[1])}.string`, temp);
                bot.guildSettings[guild.id].membercount = settings;
                countRefresh(guild);
              } else {
                bot.send(msg, `\`${temp}\` no good.`);
              }
            break;
            default:
              bot.send(msg, "sets an mc channel's title\nchoose: `total`, `bot`, `human` ?");
            break;
          }
        break;

        case "refresh":
          auditMembers(guild);
          countRefresh(guild);
        break;

        default:
          bot.send(msg, "`setup`, `set`, `refresh` ?");
        break;
      }
    }
  });
};