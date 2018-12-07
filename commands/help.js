/**
* Gives information on the bot's commands.
* @param {string} [args = null] The name of a command, for more info on that specific command.
*/

exports.info = {
  args: "[command name]",
  description: "help"
};

exports.run = (bot, msg, args) => {
  let commandCategoryFields = [];
  let commandCategoryField = {};

  for(let i in bot.commands){    
    let command = bot.commands[i];

    commandCategoryField[command.category] = commandCategoryField[command.category] || {
      name: command.category,
      value: ""
    };

    commandCategoryField[command.category].value  += " `" + command.cmd + "`";
  }

  for (let i in commandCategoryField){
    commandCategoryFields.push(commandCategoryField[i]);
  }

  if (args[0]) {
    let command = bot.commands[args[0]];

    if (!command){
      return msg.channel.createMessage("what?");
    }

    let commandInfo;

    try {
        commandInfo = require("../"+command.path).info;
        delete require.cache[require.resolve("../"+command.path)];
    }catch(err){
        return bot.log.err(err);
    }

    return bot.send(msg, {
        title: `${command.cmd} command info`,
        fields: [
          {name: "description", value: commandInfo.description},
          {name: "arguments", value: commandInfo.args}
        ]
      }
    );
  }

  return bot.send(msg, {
    description: `To get "in depth" details for commands, do \`${msg.channel.guild ? bot.guilds.get(msg.channel.guild.id).settings.prefix : ""}help [command name]\``,
    fields: commandCategoryFields
  });
};