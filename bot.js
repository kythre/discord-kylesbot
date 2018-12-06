const secret = require("./data/secret.json");
const guildSettings = require("./data/guilds.json");
const Eris = require("eris");
const fs = require("fs");
const bot = new Eris(secret.token);
const log = require("./modules/log.js");

bot.commands = {};
bot.guildSettings = guildSettings;
bot.isReady = false;
bot.log = log;
bot.secret = secret;
bot.owner = "115340880117891072";
bot.prefix = "k!";
bot.defaultStatus = "online";
bot.color = 46847;

process.on("SIGINT", () => { bot.disconnect({reconnect: false}); setTimeout(() => process.exit(0), 1000); });
process.on("exit", (code) => log.err(`Exited with code ${code}`, "Exit"));
process.on("unhandledRejection", (err) => log.err(err, "Unhandled Rejection"));
process.on("uncaughtException", (err) => log.err(err, "Unhandled Exception"));

bot.on("warn", (msg) => { if (msg.includes("Authentication")) { log.warn(msg); } });
bot.on("error", (err) => log.err(err, "Bot"));
bot.on("disconnect", () => log.log("Disconnected from Discord", "Disconnect"));

bot.audit = function (dir = "./commands", cmds = {}){
    return new Promise((resolve) => {
        fs.readdir(dir, {withFileTypes:true}, async (err, files) => {
            for (let i in files){
                let path = `${dir}/${files[i].name}`;
                if (files[i].isDirectory()){
                    await bot.audit(path, cmds);
                }else{
                    let fileextregex = /(\.js)$/gi;
                    if (files[i].name.match(fileextregex)){
                        let cmd = files[i].name.replace(fileextregex, "");

                        if (cmds[cmd]){
                            log.warn(`Duplicate command found: ${files[i].name} ${path}`);
                            continue;
                        }else{
                            let category = path.match(/[^//]+(?=\/)/g)[2];
                            category = category || "misc";

                            cmds[cmd] = {
                                path,
                                category
                            };
                            log.log(`${files[i].name} ${path}`, "Command registered:");
                        }
                    }
                }
            }
            bot.commands = cmds;
            resolve();
        });
    });
};

bot.on("ready", async () => {
    bot.guilds.forEach((g) => {
        g.cmdsrunning = {};
        g.settings = {prefix: bot.prefix};
    });

    await bot.audit();

    bot.isReady = true;
    
    log.ready(bot);
});

bot.on("messageCreate", async (msg) => {
    if (!bot.isReady || !msg.author){
        return;
    } 
    if (msg.author === bot.user){
        return;
    }

    let prefixRegex = new RegExp(`^((${bot.user.mention})|(${msg.channel.guild ? bot.guilds.get(msg.channel.guild.id).settings.prefix : bot.prefix}))\\s?`, "gi");
    let prefix = msg.content.match(prefixRegex);

    if(prefix){
        prefix = prefix[0];
    }else{
        if (msg.channel.guild){
            return;
        } 
        prefix = "";
    }

    let cmd = msg.content.slice(prefix.length).toLowerCase().split(" ")[0];
    let args = msg.content.slice(prefix.length + cmd.length).split(" ").slice(1);

    if (!bot.commands[cmd]){
        return msg.channel.createMessage(prefix + "help");
    }

    if (bot.commands[cmd] === "bot owner" && msg.author.id !== bot.owner){
        return msg.channel.createMessage("negatory");
    }

    if (bot.commands[cmd].categ === "guild" && !msg.channel.guild){
        return msg.channel.createMessage("negatory");
    }

    try {
        log.cmd(msg, bot);

        if (msg.channel.guild){
            if (bot.guilds.get(msg.channel.guild.id).cmdsrunning[cmd]){
                return bot.createMessage(msg.channel.id, {embed:
                  {
                    color: bot.color,
                    title: "Command currently running"
                  }
                });
            }
            
            bot.guilds.get(msg.channel.guild.id).cmdsrunning[cmd] = true;
        }

        await require(bot.commands[cmd].path).run(bot, msg, args);

        if (msg.channel.guild){
            bot.guilds.get(msg.channel.guild.id).cmdsrunning[cmd] = false;
        }

    } catch (err) {
        if(err.message.includes("Cannot find module") || err.message.includes("ENOENT")){
            return;
        }
        log.err(err.stack, bot.commands[cmd]);
        if(err.length > 2000){
            err = err.substring(0, err.length-(err.length-1991)) + "...";
        }
        msg.channel.createMessage(`\`\`\`${err}\`\`\``);
    }

    try {
        delete require.cache[require.resolve(bot.commands[cmd].path)];
    }catch(err){
        log.err(err.stack, "youre fucking stupid");
    }
});

bot.connect().catch((err) => log.err(err, "Login"));