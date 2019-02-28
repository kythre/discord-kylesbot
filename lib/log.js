// big stolen.
// created by TheRacingLion (https://github.com/TheRacingLion) [ 18 / 12 / 2016 ]
// -*Read LICENSE to know more about permissions*-
// logger file. Logs to console a specified input with several options.
// to know more about it, check: https://github.com/TheRacingLion/Discord-SelfBot#--logging--

module.exports = (bot) => {
  const moment = require("moment");
  const chalk = require("chalk");
  const request = require("request");
  const status = {
    online: `${chalk.green("\"online\"")}`,
    idle: `${chalk.yellow("\"idle\"")}`,
    dnd: `${chalk.red("\"dnd\"")} (Do Not Disturb)`,
    invisible: "\"invisible\""
  };

  let webhooklog = async function (title, text) {
    for (let guildID in bot.guildData.raw) {
      let webhook = bot.guildData.get(guildID, [
        "webhooks",
        "botlog"
      ]);

      if (webhook) {
        let guild = bot.guilds.get(guildID);
        let channel = guild.channels.get(webhook.channel);
        let webhooks = await channel.getWebhooks();

        webhook = webhooks.find((w) => w.id === bot.guildData.get(guildID, [
          "webhooks",
          "botlog"
        ]).webhook);

        if (webhook) {
          request.post(`https://discordapp.com/api/webhooks/${webhook.id}/${webhook.token}`, {
              json: {
                username: bot.user.username,
                avatar_url: `https://cdn.discordapp.com/avatars/${bot.user.id}/${bot.user.avatar}`,
                embeds: [
                  {
                    color: bot.color,
                    description: bot._.pad(bot.translate(title, "Math_monospace"), 35, "ㅤ") + "```csss\n" + text + "```",
                    timestamp: new Date().toISOString(),
                    footer: {
                      text: "log"
                    }
                  }
                ]
              }
            }, (error) => {
              if (error) {
                // i dunno do somth
              }
          });
        }
      }
    }
  }

  let logger = function (bg, title, text) {
    console.log(`[${chalk.cyan(moment().format("H:mm:ss"))}]${chalk[bg].bold(` ${title} `)} ${text}`);

    if (bot.isReady) {
      webhooklog(title, text);
    }
  };

  bot.log = {
    log (text, title = "Log", bg = "bgCyan") {
      logger(bg, title, text);
    },
    warn (text) {
      logger("bgYellow", "Warning", text);
    },
    err (err, title = "Bot") {
      logger("bgRed", `${title} Error`, `\n${(err && err.stack) || err}`);
    },
    fs (text, title) {
      logger("bgGreen", title, text);
    },
    cmd (msg) {
      if (typeof msg === "object") {
        const cleanMsg = msg.cleanContent.replace(/\n/g, " ");
        logger("bgYellow", "Cmd", `|> "${msg.author.username}#${msg.author.discriminator}"(${msg.author.id}) in ${chalk.magenta.bold(msg.channel.guild ? `"${msg.channel.guild.name}"` : "DM")}${msg.channel.guild ? `(${msg.channel.guild.id})` : ""}: "${cleanMsg}"`);
      }
    },
    ready () {
      const readymsg = [
        `\n/=========== Started at ${chalk.yellow(moment(bot.startTime).format("H:mm:ss"))} =============\\`,
        `| Logged in as ${chalk.yellow(bot.user.username)} (${status[bot.defaultStatus.toLowerCase()]})`,
        `| ${chalk.white("Current stats:")}`,
        `|   - ${chalk.yellow(bot.guilds.size)} servers`,
        `|   - ${chalk.yellow(Object.keys(bot.channelGuildMap).length)} channels`,
        `|   - ${chalk.yellow(bot.users.size)} users`,
        `|   - ${chalk.yellow(bot.commands.length)} commands`,
        "\\=============================================/"
      ].join("\n");

      console.log(chalk.cyan(readymsg));

      webhooklog("ready", readymsg);
    }
  };
};