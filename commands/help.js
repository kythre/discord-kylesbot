/**
* Gives information on the bot's commands.
* @param {string} [args = null] The name of a command, for more info on that specific command.
*/

exports.info = {
  args: "[command name]",
  description: "help"
};

exports.run = (bot, msg, args) => {
  let categoryEmbeds = [];
  let commandCategoryFields = {};

  for(let cmd in bot.commands){    
    let category = bot.commands[cmd].category;
    let commandCategoryField = cmdCategories[category]

    commandCategoryField = commandCategoryField || {
      name: category,
      value: ""
    };

    commandCategoryField.value  += " `" + cmd + "`";
  }

  for (let category in cmdCategories){
    commandCategoryFields.push(cmdCategories[category]);
  }

  if (args[0]) {
    let command = bot.commands[args[0]]

    if (command === undefined){
      return msg.channel.createMessage("what?");
    }

    let commandInfo;

    try {
        commandInfo = require("../"+command.path).info;
        delete require.cache[require.resolve("../"+command.path)];
    }catch(err){
        return bot.log.err(err);
    }

    return bot.createMessage(msg.channel.id, {embed: {
        color: bot.color,
        title: `${command.cmd} command info`,
        fields: [
          { name: "description", value: commandInfo.description },
          { name: "arguments", value: commandInfo.args }
        ]
      }
    });
  }

  return bot.createMessage(msg.channel.id, {
    embed: {
      description: `To get "in depth" details for commands, do \`${msg.channel.guild ? bot.guilds.get(msg.channel.guild.id).settings.prefix : ""}help [command name]\``,
      color: bot.color,
      fields: commandCategoryFields
    }
  }
);
};