/**
* Gives information on the bot's commands.
* @param {string} [args = null] The name of a command, for more info on that specific command.
*/

exports.info = {
  args: "[command name]",
  description: "help"
};

exports.run = (bot, msg, args) => {
  let categoryEmbed = [];

  for (let category in bot.commandsOrganized){
    let cmds = "";

    for (let cmd in bot.commandsOrganized[category]){
      cmds += "`" + bot.commandsOrganized[category][cmd] + "` ";
    }

    categoryEmbed.push({
      name: category,
      value: cmds
    });
  }

  if (args[0]) {
    if (!bot.commands[args[0]]){
      return msg.channel.createMessage("what?");
    }

    let cmd;

    try {
        cmd = require("../"+bot.commands[args[0]]).info;
        delete require.cache[require.resolve("../"+bot.commands[args[0]])];
    }catch(err){
        return bot.log.err(err);
    }

    bot.createMessage(msg.channel.id, {embed: {
        color: bot.color,
        title: `${args[0]} command info`,
        fields: [
          { name: "description", value: cmd.description },
          { name: "arguments", value: cmd.args }
        ]
      }
    });
  } else {
    bot.createMessage(msg.channel.id, {
        embed: {
          color: bot.color,
          fields: categoryEmbed,
          footer: {
            text: `To get \"in depth\" details for commands, do ${msg.channel.guild ? bot.guilds.get(msg.channel.guild.id).settings.prefix : bot.prefix}help [command name]`
          }
        }
      }
    );
  }
};