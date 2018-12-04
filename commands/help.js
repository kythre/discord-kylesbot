/**
* Gives information on the bot's commands.
* @param {string} [args = null] The name of a command, for more info on that specific command.
*/

exports.info = {
  args: "[command name]",
  description: "help"
}

exports.run = (self, msg, args) => {
  let fields = [
    {
      name: '**Core Commands**',
      value: '`play`, `forceplay`, `multiplay`, `stats`'
    },
    {
      name: '**Admin Commands**',
      value: '`ban`, `kick`, `prune`, `prefix`, `rolesave`, `config`'
    },
    {
      name: '**Fun Commands**',
      value: '`secrets`, `insult`, `rps`, `coin`, `roll`'
    },
    {
      name: "**Misc. Commands**",
      value: '`coin`, `pick`, `invite`, `suggest`, `about`, `info`, `guild`'
    },
    {
      name: "**Staff Commands**",
      value: '`cinv`, `eval`, `blacklist`'
    }
  ]

  let categoryEmbed = []

  for (let category in self.commandsOrganized){
    let cmds = ""
    for (let cmd in self.commandsOrganized[category]){
      cmds += '`' + self.commandsOrganized[category][cmd] + "` "
    }

    categoryEmbed.push({
      name: category,
      value: cmds
    })
  }

  if (!args[0]) {
    self.createMessage(msg.channel.id, {embed: {
      color: self.color,
      fields: categoryEmbed,
      footer: {
        text: `To get \"in depth\" details for commands, do ${msg.channel.guild ? self.guildSettings[msg.channel.guild.id].prefix : self.prefix}help [command name]`
      }
    }});
  } else {
    if (!self.commands[args[0]])
        return msg.channel.createMessage("what?");


    console.log("a")

    try {
        var cmd = require("../"+self.commands[args[0]]).info;
        delete require.cache[require.resolve("../"+self.commands[args[0]])];
    }catch(err){
        return self.log.err(err);
    }

    self.createMessage(msg.channel.id, {embed: {
        color: self.color,
        title: `${args[0]} command info`,
        fields: [
          { name: "description", value: cmd.description },
          { name: "arguments", value: cmd.args }
        ]
      }
    });
  }
};