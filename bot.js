const secret = require("./data/secret.json");
const Eris = require("eris");
const bot = new Eris(secret.token);
const fs = require("fs");
const log = require("./lib/log.js");
require("./functions.js")(bot);

process.on("SIGINT", () => {
    bot.save();
    bot.disconnect({
        reconnect: false
    });
    setTimeout(() => process.exit(0), 1000);
});
process.on("exit", (code) => {
    bot.save();
    log.err(`Exited with code ${code}`, "Exit");
});
process.on("unhandledRejection", (err) => log.err(err, "Unhandled Rejection"));
process.on("uncaughtException", (err) => log.err(err, "Unhandled Exception"));

bot.commands = {};
bot.isReady = false;
bot.log = log;
bot.secret = secret;
bot.owner = "115340880117891072";
bot.guildSettingsDefault = {
    prefix: "k!",
    persist: {
        nick: true,
        roles: true
    },
    memberCache: {}
};
bot.guildSettings = require("./data/guilds.json");
bot.defaultStatus = "online";
bot.color = 46847;

bot.on("warn", (msg) => log.warn(msg));
bot.on("error", (err) => log.err(err, "Bot"));
bot.on("disconnect", () => log.log("Disconnected from Discord", "Disconnect"));

bot.on("ready", async () => {

    fs.readdir("./modules", {
        withFileTypes: true
    }, async (err, files) => {

        for (let i in files) {
            let file = files[i];

            if (!file.isDirectory()) {
                require("./modules/" + file.name)(bot);
                log.log(`${file.name}`, "Module loaded:");
            }
        }
    });

    bot.guilds.forEach((guild) => {

        guild.cmdsrunning = {};
        guild.settings = bot.guildSettings[guild.id];

        for (let i in bot.guildSettingsDefault) {
            guild.settings[i] = guild.settings[i] || bot.guildSettingsDefault[i];
        }
    });

    await bot.audit();

    bot.isReady = true;

    log.ready(bot);
});

bot.on("messageCreate", async (msg) => {

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
    let prefixRegex = new RegExp(`^((${bot.user.mention})|(${guild ? guild.settings.prefix : bot.guildSettingsDefault.prefix}))\\s?`, "gi");
    let prefix = msg.content.match(prefixRegex);
    prefix = prefix ? prefix[0] : "";

    if (guild && !prefix) {
        return;
    }

    let cmd = bot.commands[msg.content.slice(prefix.length).toLowerCase().split(" ")[0]];
    msg.cmd = cmd;
    let args = msg.content.slice(prefix.length + cmd.name.length).split(" ").slice(1);

    // if command doesnt exist/isnt found
    if (!cmd) {
        bot.send(msg, prefix + "help");
        return;
    }

    // if command is bot owner only
    if (cmd.category === "bot owner" && msg.author.id !== bot.owner) {
        bot.commandDeny(msg, "OWNER_ONLY");
        return;
    }

    if (guild) {
        // if command is currently being processed
        if (guild.cmdsrunning[cmd.name]) {
            bot.commandDeny(msg, "CURRENTLY_RUNNING");
            return;
        }

        guild.cmdsrunning[cmd.name] = true;

        // if command is guild only
    } else if (cmd.category === "guild") {
        bot.commandDeny(msg, "SERVER_ONLY");
        return;
    }

    log.cmd(msg, bot);

    try {
        await cmd.generator(msg, args);
    } catch (err) {
        log.err(err.stack, bot.commands[cmd]);

        if (err.length > 2000) {
            err = err.substring(0, err.length - (err.length - 1991)) + "...";
        }

        bot.send(msg, `\`\`\`${err}\`\`\``);
    }

    if (guild) {
        guild.cmdsrunning[cmd.name] = false;
    }
});

bot.connect().catch((err) => log.err(err, "Login"));