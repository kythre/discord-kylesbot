module.exports = (bot) => {
  bot.registerCommand({
    name: "help",
    category: "misc",
    info: {
      args: "[command]",
      description: "help"
    },
    generator: (msg, args) => {
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

        return bot.send(msg, {
          title: `${cmd.name} command info`,
          fields: [
            {
              name: "description",
              value: cmd.info.description
            },
            {
              name: "arguments",
              value: cmd.info.args
            }
          ]
        });
      }

      return bot.send(msg, {
        description: `To get "in depth" details for commands, do \`${msg.channel.guild ? bot.guilds.get(msg.channel.guild.id).settings.prefix : ""}help [command name]\``,
        fields: commandCategoryFields
      });
    }
  });
};