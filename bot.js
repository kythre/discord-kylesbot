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

bot.activeMessages = require("./data/activeMessages.json");
bot.guildsettings = require("./data/guilds.json");
bot.usersettings = require("./data/users.json");
bot.eris = Eris;
bot.commands = [];
bot.commandAliases = {};
bot.reactionActions = {
    cancel: async (msg) => {
        bot.unwatchMessage(msg.id, msg.channel.id);
    },
    edit: (msg, action, userID) => {
        msg.removeReaction(action.emoji, userID).catch(() => {
            // catch
        });

        let resp;

        if (Array.isArray(action.response)) {
          resp = action.response[Math.floor(Math.random() * action.response.length)];
        }

        if (typeof action.response === "string") {
          resp = action.response;
        }

        if (resp !== null) {
            bot.editMessage(msg.channel.id, msg.id, resp);
        }
    },
    role: async (msg, action, userID) => {
        const member = msg.channel.guild.members.get(userID);

        if (member.roles.includes(action.response)) {
            member.removeRole(action.response);
        } else {
            member.addRole(action.response);
        }
    }
};
bot.isReady = false;
bot.log = log;
bot.fs = fs;
bot._ = _;
bot.secret = secret;
bot.owner = "115340880117891072";
bot.guildsettingsDefault = {
    prefix: "k!"
};
bot.defaultStatus = "online";
bot.color = 46847;
bot.onMessageReactionEvent = async function (msg_, emoji_, userID) {
    if (!bot.ready || userID === bot.user.id) {
        return;
    }

    if (bot.activeMessages[msg_.id]) {
        const emoji = emoji_.id ? `${emoji_.name}:${emoji_.id}` : emoji_.name;
        let msg = msg_;

        if (!(msg.content || msg.embeds || msg.attachments)) {
            msg = await bot.getMessage(msg.channel.id, msg.id);
        }

        let activeMessage = bot.activeMessages[msg.id];
        msg.command = bot.commands[activeMessage.command];
        let reactionButtons = msg.command.reactionButtons;
        const action = reactionButtons.find((button) => button.emoji === emoji);

        if (!action) {
            return;
        }

        try {
            await bot.reactionActions[action.type](msg, action, userID);
        } catch (err) {} // eslint-disable-line no-empty
    }
};
bot.unwatchMessage = function (id, channelID) {
    delete bot.activeMessages[id];
    if (channelID) {
        bot.removeMessageReactions(channelID, id).catch(() => {
            bot.getMessage(channelID, id).then((msg) => {
                for (let i in msg.reactions) {
                    if (msg.reactions[i].me) {
                        msg.removeReaction(i);
                    }
                }
            });
        });
    }
};
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

    // save data every 10 minutes
    setInterval(async () => {
        log.log("start", "Save");
        await bot.save();
        log.log("done", "Save");
    }, 600000);

    log.ready(bot);
});

bot.on("messageReactionAdd", bot.onMessageReactionEvent);
bot.on("messageReactionRemove", bot.onMessageReactionEvent);

bot.on("guildCreate", async (guild) => {
    log.log(`"${guild.name}"`, "Guild join");
});

bot.on("messageDelete", (msg) => {
    if (bot.activeMessages[msg.id]) {
        delete bot.activeMessages[msg.id];
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

    if (msg.content.includes("Lucy.png") || msg.content.includes("sf.png") || (msg.attachments[0] ? msg.attachments[0].url.includes("Lucy.png") || msg.attachments[0].url.includes("sf.png") : false)) {
        bot.getDMChannel(bot.owner).then((c) => bot.createMessage(c.id, `\`\`\` ${msg.author.username} ${msg.author.id}\n--------------------\n${msg.cleanContent}\`\`\``));
        log.log("lucy image found");
        console.log(msg);
        msg.delete();
        return;
    }

    let guild = msg.channel.guild ? msg.channel.guild : "";
    let prefixRegex = new RegExp(`^((<@!?${bot.user.mention.slice(2)})|(${guild ? bot.guildSettingsGet(guild.id, "prefix").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : bot.guildsettingsDefault.prefix}))\\s?`, "gi");
    let prefix = msg.content.match(prefixRegex);
    prefix = prefix ? prefix[0] : "";

    if (guild && !prefix) {
        return;
    }

     // const command = bot.commands[msg.content.slice(prefix.length).toLowerCase().split(" ")[0]];
    const command = bot.commands.find((cmd) => {
        let cmdName = msg.content.slice(prefix.length).toLowerCase().split(" ")[0];
        return cmd.label === cmdName || cmd.aliases.find((alias) => alias === cmdName);
    });

    if (!command) {
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

    msg.command = command;

    // if command is currently being processed
    if (msg.channel.cmdrunning) {
        bot.commandDeny(msg, "CURRENTLY_RUNNING");
        return;
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

    let args = msg.content.slice(prefix.length + command.label.length);

    // gross
    if (command.label === "eval" || command.label === "say") {
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

    // msg.channel.cmdrunning = true;

    try {
        const resp = await command.process(args, msg);
        if (resp !== null) {
            if (command.reactionButtons) {
                command.reactionButtons.forEach((button) => {
                    resp.addReaction(button.emoji);
                });
                bot.activeMessages[resp.id] = {
                    args,
                    command: command.label
                };
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