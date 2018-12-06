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
  let cmdCategories = {};

  for(let cmd in bot.commands){    
    let category = bot.commands[cmd].category;

    cmdCategories[category] = cmdCategories[category] || {
      name: category,
      value: ""
    };

    cmdCategories[category].value  += " `" + cmd + "`";
  }

  for (let category in cmdCategories){
    categoryEmbed.push(cmdCategories[category]);
  }

  if (args[0]) {
    if (!bot.commands[args[0]]){
      return msg.channel.createMessage("what?");
    }

    let cmd;

    try {
        cmd = require("../"+bot.commands[args[0]].path).info;
        delete require.cache[require.resolve("../"+bot.commands[args[0]].path)];
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
          description: `To get \"in depth\" details for commands, do \`${msg.channel.guild ? bot.guilds.get(msg.channel.guild.id).settings.prefix : ""}help [command name]\``,
          color: bot.color,
          fields: categoryEmbed
        }
      }
    );
  }
};