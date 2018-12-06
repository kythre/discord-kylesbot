const secret = require("./data/secret.json");
const Eris = require("eris");
const bot = new Eris(secret.token);
const fs = require("fs");
const log = require("./modules/log.js");
const guildSettings = require("./data/guilds.json");

process.on("SIGINT", () => { bot.disconnect({reconnect: false}); setTimeout(() => process.exit(0), 1000); });
process.on("exit", (code) => log.err(`Exited with code ${code}`, "Exit"));
process.on("unhandledRejection", (err) => log.err(err, "Unhandled Rejection"));
process.on("uncaughtException", (err) => log.err(err, "Unhandled Exception"));

bot.commands = {};
bot.guildSettings = guildSettings;
bot.isReady = false;
bot.log = log;
bot.secret = secret;
bot.owner = "115340880117891072";
bot.prefix = "k!";
bot.defaultStatus = "online";
bot.color = 46847;

bot.on("warn", (msg) => { if (msg.includes("Authentication")) { log.warn(msg); } });
bot.on("error", (err) => log.err(err, "Bot"));
bot.on("disconnect", () => log.log("Disconnected from Discord", "Disconnect"));

bot.audit = function (dir = "./commands", cmds = {}){
    return new Promise((resolve, reject) => {
        fs.readdir(dir, {withFileTypes:true}, async (err, files) => {
            if(err){
                reject();
            }

            for (let i in files){
                let file = files[i];
                let path = `${dir}/${file.name}`;

                if (file.isDirectory()){
                    await bot.audit(path, cmds);
                }else{
                    let regexJSFile = /(\.js)$/gi;
                    if (file.name.match(regexJSFile)){
                        let cmd = file.name.replace(regexJSFile, "");

                        if (cmds[cmd]){
                            log.warn(`Duplicate command found: ${file.name} ${path}`);
                        }else{
                            let category = path.match(/[^//]+(?=\/)/g)[2] || "misc";

                            cmds[cmd] = {
                                cmd,
                                path,
                                category
                            };

                            log.log(`${file.name} ${path}`, "Command registered:");
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

    if (prefix !== null){
        prefix = prefix[0];
    }else{
        if (msg.channel.guild){
            return;
        } 
        prefix = "";
    }

    let cmd = bot.commands[msg.content.slice(prefix.length).toLowerCase().split(" ")[0]];

    if (!cmd){
        msg.channel.createMessage(prefix + "help");
        return;
    }

    let args = msg.content.slice(prefix.length + cmd.cmd.length).split(" ").slice(1);

    if (cmd.category === "bot owner" && msg.author.id !== bot.owner){
        msg.channel.createMessage("negatory");
        return;
    }

    if (cmd.category === "guild" && !msg.channel.guild){
        msg.channel.createMessage("negatory");
        return;
    }

    try {
        log.cmd(msg, bot);

        if (msg.channel.guild){
            if (bot.guilds.get(msg.channel.guild.id).cmdsrunning[cmd.cmd]){
                bot.createMessage(msg.channel.id, {embed:
                    {
                      color: bot.color,
                      title: "Command currently running"
                    }
                  });
                return;
            }
            
            bot.guilds.get(msg.channel.guild.id).cmdsrunning[cmd.cmd] = true;
        }

        await require(cmd.path).run(bot, msg, args);
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

    if (msg.channel.guild){
        bot.guilds.get(msg.channel.guild.id).cmdsrunning[cmd.cmd] = false;
    }

    try {
        delete require.cache[require.resolve(cmd.path)];
    }catch(err){
        log.err(err.stack, "youre fucking stupid");
    }
});

bot.connect().catch((err) => log.err(err, "Login"));