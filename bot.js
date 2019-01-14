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

bot.commands = {};
bot.isReady = false;
bot.log = log;
bot.fs = fs;
bot._ = _;
bot.secret = secret;
bot.owner = "115340880117891072";
bot.guildsettingsDefault = {
    prefix: "k!"
};
bot.guildsettings = require("./data/guilds.json");
bot.usersettings = require("./data/users.json");
bot.defaultStatus = "online";
bot.color = 46847;

bot.on("warn", (msg) => log.warn(msg));
bot.on("error", (err) => log.err(err, "Bot"));
bot.on("disconnect", () => log.log("Disconnected from Discord", "Bot"));
bot.on("ready", async () => {
    await fs.readdir("./modules", {
        withFileTypes: true
    }, (err, files) => {

        for (let i in files) {
            let file = files[i];

            if (!file.isDirectory()) {
                require("./modules/" + file.name)(bot);
                log.log(`${file.name}`, "Module loaded:");
            }
        }
    });

    await bot.audit();

    bot.isReady = true;

    // save data every 5 minutes
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

bot.on("messageCreate", async (msg) => {
    if (msg.channel.prompt) {
        msg.channel.prompt(msg);
        return;
    }

    if (!bot.isReady || !msg.author) {
        return;
    }

    if (msg.author === bot.user) {
        return;
    }

    if (msg.author.bot) {
        return;
    }

    let guild = msg.channel.guild ? msg.channel.guild : "";
    let prefixRegex = new RegExp(`^((<@!?${bot.user.mention.slice(2)})|(${guild ? bot.guildSettingsGet(guild.id, "prefix") : ""}))\\s?`, "gi");
    let prefix = msg.content.match(prefixRegex);
    prefix = prefix ? prefix[0] : "";

    if (guild && !prefix) {
        return;
    }

    let cmd = bot.commands[msg.content.slice(prefix.length).toLowerCase().split(" ")[0]];
    msg.cmd = cmd;

    // if command is currently being processed
    if (msg.channel.cmdrunning) {
        bot.commandDeny(msg, "CURRENTLY_RUNNING");
        return;
    }

    if (!cmd) {
        if (guild) {
            if (prefix.match(new RegExp(`^(<@!?${bot.user.mention.slice(2)})`, "i"))) {
                prefix = `@${msg.channel.guild.members.get(bot.user.id).nick ? msg.channel.guild.members.get(bot.user.id).nick : bot.user.username} `;
            }
            bot.send(msg, prefix + "help");
        } else {
            bot.getDMChannel(bot.owner).then((c) => bot.createMessage(c.id, `\`\`\` ${msg.author.username} ${msg.author.id}\n--------------------\n${msg.cleanContent}\`\`\``));
        }
        return;
    }

    // if command is bot owner only
    if (cmd.category === "bot owner" && msg.author.id !== bot.owner) {
        bot.commandDeny(msg, "OWNER_ONLY");
        return;
    }

    // if command is guild only
    if (!guild && cmd.category === "guild") {
        bot.commandDeny(msg, "SERVER_ONLY");
        return;
    }

    let args = msg.content.slice(prefix.length + cmd.name.length);

    // gross
    if (cmd.name === "eval" || cmd.nane === "say") {
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

    log.cmd(msg, bot);

    msg.channel.cmdrunning = true;

    try {
        await cmd.generator(msg, args);
    } catch (err) {
        if (err) {
            if (err.message === "cancelled") {
                bot.send(msg, "command cancelled");
            } else if (err.message === "timeout") {
                bot.send(msg, "command timed out", {timestamp: new Date().toISOString()});
            } else {
                log.err(err, bot.commands[cmd]);

                let stack = err.stack;

                if (stack.length > 2000) {
                    stack = stack.substring(0, stack.length - 1989) + "...";
                }

                bot.send(msg, `\`${err.message}\``, `\`\`\`js\n${err.stack}\`\`\``);
            }
        }
    }

    msg.channel.cmdrunning = false;
});
bot.connect().catch((err) => log.err(err, "Login"));