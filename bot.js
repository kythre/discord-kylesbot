const secret = require('./data/secret.json')
const guildSettings = require('./data/guilds.json')
const Eris = require('eris')
const fs = require('fs');
const self = new Eris(secret.token)
const log = require('./modules/log.js')

self.commands = {}
self.commandsOrganized = {}
self.guildSettings = guildSettings || {}
self.isReady = false
self.log = log
self.secret = secret
self.owner = "115340880117891072"
self.prefix = "k!"
self.defaultStatus = "online"
self.color = 0x00B6FF

process.on('SIGINT', () => { self.disconnect({reconnect: false}); setTimeout(() => process.exit(0), 1000) });
process.on('exit', (code) => log.err(`Exited with code ${code}`, 'Exit'));
process.on('unhandledRejection', (err) => log.err(err, 'Promise was rejected but there was no error handler'));
process.on('uncaughtException', (err) => log.err(err, 'Exception'));

self.on('warn', (msg) => { if (msg.includes('Authentication')) { log.warn(msg) } });
self.on('error', (err) => log.err(err, 'Bot'));
self.on('disconnect', () => log.log('Disconnected from Discord', 'Disconnect'));

self.audit = function (dir = "./commands", cmds = {}){
    return new Promise(resolve => {
        fs.readdir(dir, {withFileTypes:true}, async (err, files)=>{
            for (let i in files){
                let path = `${dir}/${files[i].name}`
                if (files[i].isDirectory()){
                    await self.audit(path, cmds)
                }else{
                    let fileextregex = /(\.js)$/gi
                    if (files[i].name.match(fileextregex)){
                        let cmd = files[i].name.replace(fileextregex, "")

                        if (cmds[cmd]){
                            log.warn(`Duplicate command found: ${files[i].name} ${path}`)
                            continue
                        }else{
                            cmds[cmd] = path

                            let category = path.match(/[^//]+(?=\/)/g)[2]
                            category = category || "misc"
                            self.commandsOrganized[category] = self.commandsOrganized[category] || []
                            self.commandsOrganized[category].push(cmd);
                            log.log(`${files[i].name} ${path}`, "Command registered:");
                        }
                    }
                }
            }
            self.commands = cmds;
            resolve();
        });
    });
}

self.on('ready', async () => {
    self.guilds.forEach(g => {
        if(!self.guildSettings[g.id]) self.guildSettings[g.id] = {prefix: self.prefix};
    });

    await self.audit();

    self.isReady = true
    
    log.ready(self)
});

self.on('messageCreate', (msg) => {
    if (!self.isReady || !msg.author) return;
    if (msg.author == self.user) return;

    let prefixRegex = new RegExp(`^((${self.user.mention})|(${msg.channel.guild ? self.guildSettings[msg.channel.guild.id].prefix : self.prefix}))\\s?`, "gi")
    let prefix = msg.content.match(prefixRegex);

    if(prefix){
        prefix = prefix[0]
    }else{
        if (msg.channel.guild) return;
        prefix = ''
    }

    let cmd = msg.content.slice(prefix.length).toLowerCase().split(' ')[0];
    let args = msg.content.slice(prefix.length + cmd.length).split(' ').slice(1);

    if (!self.commands[cmd])
        return msg.channel.createMessage(prefix+"help");

    if (self.commands[cmd].includes("bot owner") && msg.author.id !== self.owner)
        return msg.channel.createMessage("negatory");

    try {
        log.cmd(msg, self)
        require(self.commands[cmd]).run(self, msg, args);
    } catch (err) {
        if(err.message.includes('Cannot find module') || err.message.includes('ENOENT')) return;
        log.err(err.stack);
        if(err.length > 2000) err = err.substring(0, err.length-(err.length-1991)) + "...";
        msg.channel.createMessage(`\`\`\`${err}\`\`\``);
    }

    try {
        delete require.cache[require.resolve(self.commands[cmd])]
    }catch(err){
        log.err(err, "youre fucking stupid")
    }
});

self.connect().catch(err => log.err(err, 'Login'));