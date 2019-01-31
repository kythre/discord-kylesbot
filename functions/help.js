module.exports = (bot) => {

  let commandCategoryFields = [];

  bot.registerCommand({
    name: "help",
    category: "misc",
    info: {
      args: "[command]",
      description: "help"
    },
    generator: (msg, args) => {

      // gross
      if (commandCategoryFields.length === 0) {
        let commandCategoryField = {};

        for (let i in bot.commands) {
          let cmd = bot.commands[i];

          commandCategoryField[cmd.description] = commandCategoryField[cmd.description] || {
            name: cmd.description,
            value: "",
            inline: true
          };

          commandCategoryField[cmd.description].value += " `" + cmd.label + "`";
        }

        for (let i in commandCategoryField) {
          commandCategoryFields.push(commandCategoryField[i]);
        }
      }

      if (args[0]) {
        const cmd = bot.commands.find((cmd_) => {
          let cmdName = args[0];
          return cmd_.label === cmdName || cmd_.aliases.find((alias) => alias === cmdName);
      });

        if (!cmd) {
          return msg.channel.createMessage("what?");
        }

        return bot.send(msg, "help", {
          title: `${cmd.label + " command info"}`,
          fields: [
            {
              name: "description",
              value: cmd.fullDescription
            },
            {
              name: "arguments",
              value: cmd.usage
            }
          ]
        });
      }

      return bot.send(msg, "help", {
        description: `To get "in depth" details for commands, do \`${msg.channel.guild ? bot.guildSettingsGet(msg.channel.guild.id, "prefix") : ""}help [command name]\``,
        fields: commandCategoryFields
      });
    }
  });
};