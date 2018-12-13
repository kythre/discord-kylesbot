// big stolen.
// created by TheRacingLion (https://github.com/TheRacingLion) [ 18 / 12 / 2016 ]
// -*Read LICENSE to know more about permissions*-
// logger file. Logs to console a specified input with several options.
// to know more about it, check: https://github.com/TheRacingLion/Discord-SelfBot#--logging--

const moment = require("moment");
const chalk = require("chalk");
const status = {
  online: `${chalk.green("\"online\"")}`,
  idle: `${chalk.yellow("\"idle\"")}`,
  dnd: `${chalk.red("\"dnd\"")} (Do Not Disturb)`,
  invisible: "\"invisible\""
};

let logger = function (bg, title, text) {
  console.log(`[${chalk.cyan(moment().format("H:mm:ss"))}]${chalk[bg].bold(` ${title} `)} ${text}`);
};

module.exports = {
  log (text, title = "Log", bg = "bgCyan") {
    logger(bg, title, text);
  },
  warn (text) {
    logger("bgYellow", "Warning", text);
  },
  err (err, title = "Bot") {
    logger("bgRed", `${title} Error`, `\n${err}`);
  },
  fs (text, title) {
    logger("bgGreen", title, text);
  },
  cmd (msg) {
    if (typeof msg === "object") {
      const cleanMsg = msg.cleanContent.replace(/\n/g, " ");
      logger("bgYellow", "Msg", `|> ${chalk.magenta.bold(msg.channel.guild ? msg.channel.guild.name : "in DMs")}: ${cleanMsg}`);
    }
  },
  ready (bot) {
    console.log(chalk.cyan([
      `\n/==================== Started at ${chalk.yellow(moment(bot.startTime).format("H:mm:ss"))} ====================/`,
      `| Logged in as ${chalk.yellow(bot.user.username)}.`,
      `| ${chalk.white(`Your discord status is ${status[bot.defaultStatus.toLowerCase()]}. Current stats:`)}`,
      `|   - ${chalk.yellow(bot.guilds.size)} servers (${chalk.yellow(Object.keys(bot.channelGuildMap).length)} channels) (${chalk.yellow(bot.users.size)} users)`,
      `| ${chalk.white("Logging was successful. Waiting for orders...")}`,
      `| Use ${chalk.yellow("Control + C")} to exit. Or ${chalk.yellow("Cmd + C")} for Mac.`,
      "/=============================================================/"
    ].join("\n")));
  }
};