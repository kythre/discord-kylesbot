/**
 * gives information on the bot's commands.
 * @param {string} [args = null] The name of a command, for more info on that specific command.
 */

exports.info = {
  args: "[command name]",
  description: "help"
};

exports.run = (bot, msg, args) => {
  let commandCategoryFields = [];
  let commandCategoryField = {};

  for (let i in bot.commands) {
    let cmd = bot.commands[i];

    commandCategoryField[cmd.category] = commandCategoryField[cmd.category] || {
      name: cmd.category,
      value: ""
    };

    commandCategoryField[cmd.category].value += " `" + cmd.name + "`";
  }

  for (let i in commandCategoryField) {
    commandCategoryFields.push(commandCategoryField[i]);
  }

  if (args[0]) {
    let cmd = bot.commands[args[0]];

    if (!cmd) {
      return msg.channel.createMessage("what?");
    }

    let commandInfo;

    try {
      commandInfo = require("../" + cmd.path).info;
      delete require.cache[require.resolve("../" + cmd.path)];
    } catch (err) {
      return bot.log.err(err);
    }

    return bot.send(msg, {
      title: `${cmd.name} command info`,
      fields: [
        {
          name: "description",
          value: commandInfo.description
        },
        {
          name: "arguments",
          value: commandInfo.args
        }
      ]
    });
  }

  return bot.send(msg, {
    description: `To get "in depth" details for commands, do \`${msg.channel.guild ? bot.guilds.get(msg.channel.guild.id).settings.prefix : ""}help [command name]\``,
    fields: commandCategoryFields
  });
};