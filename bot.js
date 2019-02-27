const secret = require("./data/secret.json");
const Eris = require("eris");
const bot = new Eris(secret.token);
const fs = require("fs");
const log = require("./lib/log.js");
const _ = require("lodash");

require("./lib/message.js")(bot);
require("./lib/file.js")(bot);
require("./lib/commands.js")(bot);
require("./lib/misc.js")(bot);

process.on("SIGINT", async () => {
    await bot.save();
    bot.disconnect({
        reconnect: false
    });
    setTimeout(() => process.exit(0), 1000);
});
process.on("exit", async (code) => {
    await bot.save();
    log.err(`Exited with code ${code}`, "Bot");
});
process.on("unhandledRejection", (err) => log.err(err, "Unhandled Rejection", "Bot"));
process.on("uncaughtException", (err) => log.err(err, "Unhandled Exception", "Bot"));

class Data {
    constructor (file, defaults) {
        this.raw = require(file);
        this.defaults = defaults || {};
    }

    get (id, path) {
        if (typeof path === "undefined") {
            return this.raw[id];
        }
        return bot._.get(this.raw[id], path) || bot._.get(this.defaults, path);
    }

    set (id, path, value) {
        if (typeof value === "undefined") {
            throw new Error("attempt to set guild setting to undefined");
        }
        this.raw[id] = this.raw[id] || {};
        bot._.set(this.raw[id], path, value);
    }
}

bot.globalData = new Data("./data/global.json");
bot.guildData = new Data("./data/guilds.json", {
    prefix: "k!"
});
bot.userData = new Data("./data/users.json");
bot.getCommand = (cmdName) => bot.commands.find((cmd) => cmd.label === cmdName || cmd.aliases.find((alias) => alias === cmdName));
bot.eris = Eris;
bot.commands = [];
bot.commandAliases = {};
bot.isReady = false;
bot.log = log;
bot.fs = fs;
bot._ = _;
bot.secret = secret;
bot.owner = "115340880117891072";
bot.defaultStatus = "online";
bot.color = 46847;
bot.registerCommandConfigStr({
    name: "setprefix",
    verbose: "bot prefix",
    setting: "prefix",
    permission: "guild"
});

bot.on("warn", (msg) => log.warn(msg));
bot.on("error", (err) => log.err(err, "Bot"));
bot.on("disconnect", () => log.log("Disconnected from Discord", "Bot"));
bot.on("ready", async () => {
    if (bot.isReady) {
        return;
    }

    await bot.audit();

    bot.isReady = true;

    // save data every 10 minutes
    setInterval(async () => {
        log.log("start", "Save");
        await bot.save();
        log.log("done", "Save");
    }, 600000);

    log.ready(bot);
});

bot.on("guildCreate", async (guild) => {
    log.log(`"${guild.name}"`, "Guild join");
});

bot.on("messageDelete", (msg) => {
    if (bot.globalData.get("activeMessages", [
        msg.channel.id,
        msg.id
    ])) {
        bot.unwatchMessage(msg.channel.id, msg.id);
    }
});

bot.on("messageCreate", async (msg) => {
    if (msg.channel.prompt) {
        msg.channel.prompt(msg);
        return;
    }

    if (!bot.isReady || !msg.author || msg.author === bot.user || msg.author.bot) {
        return;
    }

    const guild = msg.channel.guild ? msg.channel.guild : "";
    const prefixRegex = new RegExp(`^((<@!?${bot.user.mention.slice(2)})|(${bot.guildData.get(guild.id, "prefix").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}))\\s?`, "gi");
    let prefix = msg.content.match(prefixRegex);
    prefix = prefix ? prefix[0] : "";

    if (guild && !prefix) {
        return;
    }

     // const command = bot.commands[msg.content.slice(prefix.length).toLowerCase().split(" ")[0]];
    const cmdName = msg.content.slice(prefix.length).toLowerCase().split(" ")[0];
    if (!cmdName) {
        return;
    }
    const command = bot.getCommand(cmdName);

    if (!command) {
        if (guild) {
            if (prefix.match(new RegExp(`^(<@!?${bot.user.mention.slice(2)})`, "i"))) {
                prefix = `@${msg.channel.guild.members.get(bot.user.id).nick ? msg.channel.guild.members.get(bot.user.id).nick : bot.user.username} `;
            }
            bot.send(msg, prefix + "help");
        } else {
            // bot.getDMChannel(bot.owner).then((c) => bot.createMessage(c.id, `\`\`\` ${msg.author.username} ${msg.author.id}\n--------------------\n${msg.cleanContent}\`\`\``));
        }
        return;
    }

    msg.command = command;

    // if user is blacklisted
    if ((bot.userData.get(msg.author.id, "tags") || []).includes("blacklisted")) {
        bot.commandDeny(msg, "USER_BLACKLISTED");
        return;
    }

    // if command is currently being processed
    if (msg.channel.cmdrunning) {
        bot.commandDeny(msg, "CURRENTLY_RUNNING");
        return;
    }

    for (let i in bot._.get(command, "requirements.permissions") || {}) {
        if (bot.checkPerm(msg, i) !== command.requirements.permissions[i]) {
            return;
        }
    }

    // if command is bot owner only
    if (bot._.get(command, "requirements.userIDs").length && !command.requirements.userIDs.includes(msg.author.id)) {
        bot.commandDeny(msg, "OWNER_ONLY");
        return;
    }

    // if command is guild only
    if (!guild && command.guildOnly) {
        bot.commandDeny(msg, "SERVER_ONLY");
        return;
    }

    // if command is dm only
    if (guild && command.dmOnly) {
        bot.commandDeny(msg, "DM_ONLY");
        return;
    }

    let args = msg.content.slice(prefix.length + command.label.length);

    // gross
    // split args unless the command needs the args together
    if (command.label === "eval" || command.label === "say" || command.label === "confess") {
        args = args.split(" ").slice(1);
    } else {
        args = bot._.trim(args);
        args = args.split(/("[^"]*")/g);
        args = bot._.map(args, (x) => bot._.trim(x));
        args = bot._.compact(args);
        args = bot._.map(args, (x) => {
            if (x.match(/("[^"]*")/g)) {
                return bot._.trim(x, "\"");
            }
            return x.split(" ");
        });
        args = bot._.flattenDeep(args);
    }

    if (command.label !== "confess") {
        log.cmd(msg, bot);
    }

    // msg.channel.cmdrunning = true;

    try {
        const resp = await command.process(args, msg);
        if (resp !== null) {
            if (command.reactionButtons) {
                command.reactionButtons.forEach((button) => {
                    resp.addReaction(button.emoji);
                });
                bot.globalData.set("activeMessages", [
                    resp.channel.id,
                    resp.id
                ], {
                    args,
                    command: command.label,
                    timeout: command.reactionButtonTimeout === -1 ? null : Date.now() + command.reactionButtonTimeout
                });
                if (command.reactionButtonTimeout !== -1) {
                    setTimeout(() => bot.unwatchMessage(resp.channel.id, resp.id), command.reactionButtonTimeout);
                }
            }
        }
    } catch (err) {
        if (err) {
            if (err.message === "cancelled") {
                bot.send(msg, "command cancelled");
            } else if (err.message === "timeout") {
                bot.send(msg, "command timed out", {timestamp: new Date().toISOString()});
            } else {
                log.err(err, bot.commands[command]);

                let stack = err.stack;

                if (stack.length > 2000) {
                    stack = stack.substring(0, stack.length - 1989) + "...";
                }

                bot.send(msg, `\`${err.message}\``, `\`\`\`js\n${err.stack}\`\`\``);
            }
        }
    }

   // msg.channel.cmdrunning = false;
});

bot.connect().catch((err) => log.err(err, "Login"));