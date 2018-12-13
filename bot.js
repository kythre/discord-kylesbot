const secret = require("./data/secret.json");
const Eris = require("eris");
const bot = new Eris(secret.token);
const fs = require("fs");
const log = require("./modules/log.js");

process.on("SIGINT", () => { bot.save(); bot.disconnect({reconnect: false}); setTimeout(() => process.exit(0), 1000); });
process.on("exit", (code) => { bot.save(); log.err(`Exited with code ${code}`, "Exit")});
process.on("unhandledRejection", (err) => log.err(err, "Unhandled Rejection"));
process.on("uncaughtException", (err) => log.err(err, "Unhandled Exception"));

bot.commands = {};
bot.isReady = false;
bot.log = log;
bot.secret = secret;
bot.owner = "115340880117891072";
bot.guildSettingsDefault = {prefix: "k!", persist: {nick: true, roles: true}, memberCache: {}, flair: {}};
bot.guildSettings = require("./data/guilds.json");
bot.defaultStatus = "online";
bot.color = 46847;

bot.on("warn", (msg) => log.warn(msg));
bot.on("error", (err) => log.err(err, "Bot"));
bot.on("disconnect", () => log.log("Disconnected from Discord", "Disconnect"));

bot.send = function (msg, content){

    let embed;

    if (typeof content  === 'string'){
        embed = {description: content};
    }else{
        embed = content;
    }

    // embed.footer = `${msg.author.username}#${msg.author.discriminator}`
    //embed.footer = `${msg.content.split(" ")[0]}`
    embed.footer = `${msg.content.split(" ")[1] || ""}`
    embed.footer = {text: embed.footer};
    embed.timestamp = embed.timestamp || new Date(msg.timestamp).toISOString();
    embed.color = embed.color || bot.color;

    msg.channel.createMessage({embed});
};

bot.commandDeny = function (msg, info){

    let reason;
    let specific;
    let user;

    if (typeof msg  === 'string'){
        reason = info;
    }else{
        reason = info.reason;
        user = info.user;
        specific = info.perm;
    }

    switch(reason){
        case "SERVER_ONLY":
            break;
        case "BOT_OWNLY":
            break;
        case "MISSING_PERM":
            break;
	case "CURRENTLY_RUNNING":
	    break;
        default:
            break;
    }

    bot.send(msg, "negatory");
};

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
                                name: cmd,
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

bot.checkPerm = function (msg, perm){

    if (!msg.channel.guild.members.get(msg.author.id).permission.has(perm)){
        bot.commandDeny(msg, {reason: "MISSING_PERM", user: msg.author, perm});
        return false;
    }
    if (!msg.channel.guild.members.get(bot.user.id).permission.has(perm)){
        bot.commandDeny(msg, {reason: "MISSING_PERM", user: bot.user, perm});
        return false;
    }
    return true;
};

bot.save = function (){

    return new Promise((resolve, reject) => {

        let json = JSON.stringify(bot.guildSettings, null, 4);

        fs.writeFile('./data/guilds.json', json, 'utf8', ()=>{
            resolve();
        });
    });
};

bot.on("ready", async () => {
    
    bot.guilds.forEach((guild) => {

        guild.cmdsrunning = {};
        guild.settings = bot.guildSettings[guild.id];

        for(let i in bot.guildSettingsDefault){
            guild.settings[i] = guild.settings[i] || bot.guildSettingsDefault[i];
        }
    });

    await bot.audit();

    bot.isReady = true;

    log.ready(bot);
});

let cacheMember = function(guild, member){

    if (member.bot){
        return;
    }

    guild.settings.memberCache[member.id] = {nick: member.nick, roles: member.roles};
}

bot.on("guildMemberRemove", cacheMember);
bot.on("guildMemberUpdate", cacheMember);

bot.on("guildMemberAdd", (guild, member)=>{

    if (member.bot){
        return;
    }

    let memberCache = guild.settings.memberCache[member.id];

    if(memberCache){
        try{
            member.edit({
                roles: memberCache.roles,
                nick: memberCache.nick
            }, "Persist");
        }catch(err){}
    }
});

bot.on("messageCreate", async (msg) => {

    if (!bot.isReady || !msg.author){
        return;
    }

    if (msg.author === bot.user){
        return;
    }

    if (msg.author.bot){
        return;
    }

    let guild;

    if (msg.channel.guild){
        guild = msg.channel.guild;
    }

    let prefixRegex = new RegExp(`^((${bot.user.mention})|(${guild ? guild.settings.prefix : bot.guildSettingsDefault.prefix}))\\s?`, "gi");
    let prefix = msg.content.match(prefixRegex);

    if (prefix !== null){
        prefix = prefix[0];
    }else{
        if (guild){
            return;
        }
        prefix = "";
    }

    let cmd = bot.commands[msg.content.slice(prefix.length).toLowerCase().split(" ")[0]];

    if (!cmd){
        bot.send(msg, prefix + "help");
        return;
    }

    let args = msg.content.slice(prefix.length + cmd.name.length).split(" ").slice(1);

    if (cmd.category === "bot owner" && msg.author.id !== bot.owner){
        bot.commandDeny(msg, "OWNER_ONLY");
        return;
    }

    if (cmd.category === "guild" && !guild){
        bot.commandDeny(msg, "SERVER_ONLY");
        return;
    }

    if (guild){
        if (guild.cmdsrunning[cmd.name]){
            bot.commandDeny(msg, "CURRENTLY_RUNNING");
            return;
        }

        guild.cmdsrunning[cmd.name] = true;
    }

    log.cmd(msg, bot);

    try {
        await require(cmd.path).run(bot, msg, args);

    } catch (err) {
        
        if(err.message.includes("Cannot find module") || err.message.includes("ENOENT")){
            return;
        }

        log.err(err.stack, bot.commands[cmd]);

        if(err.length > 2000){
            err = err.substring(0, err.length-(err.length-1991)) + "...";
        }

        bot.send(msg,`\`\`\`${err}\`\`\``);
    }

    if (guild){
        guild.cmdsrunning[cmd.name] = false;
    }

    try {
        delete require.cache[require.resolve(cmd.path)];
    }catch(err){
        log.err(err.stack, "youre fucking stupid");
    }
});

bot.connect().catch((err) => log.err(err, "Login"));