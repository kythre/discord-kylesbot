module.exports = (bot) => {
  bot.checkPerm = function (msg, perm) {
    if (!msg.channel.guild.members.get(msg.author.id).permission.has(perm)) {
      bot.commandDeny(msg, {
        reason: "MISSING_PERM",
        user: msg.author,
        specific: perm
      });
      return false;
    }
    if (!msg.channel.guild.members.get(bot.user.id).permission.has(perm)) {
      bot.commandDeny(msg, {
        reason: "MISSING_PERM",
        user: bot.user,
        specific: perm
      });
      return false;
    }
    return true;
  };

  bot.commandDeny = function (msg, info) {
    let reason;
    let specific;
    let user;

    if (typeof info === "string") {
      reason = info;
    } else {
      reason = info.reason;
      user = info.user;
      specific = info.specific;
    }

    switch (reason) {
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

    bot.send(msg, "negatory " + (user ? user.username + " " : "") + reason + (specific ? " " + specific : ""));
  };

  bot.registerCommand = function (cmd) {

    if (bot.commands[cmd.name]) {
      bot.log.warn(cmd.name, "Overwriting command:");
    } else {
      bot.log.log(cmd.name, "Command registered:");
    }

    bot.commands[cmd.name] = cmd;
  };

  // cmd = {
  //   name: "setting name",
  //   verbose: "setting description",
  //   setting: "setting path",
  //   permission: "guild or user"
  // }

  bot.registerCommandConfigStr = function (cmd) {
    bot.registerCommand({
      name: cmd.name,
      category: cmd.category || cmd.permission,
      info: {
        args: "[value]",
        description: `sets ${cmd.verbose} to [value]`
      },
      generator: (msg, args) => {
        let id, settings;


        if (cmd.permission === "guild") {
          if (!bot.checkPerm(msg, "manageGuild")) {
            return;
          }
          settings = bot.guildsettings;
          id = msg.channel.guild.id;
        } else if (cmd.permission === "user") {
          settings = bot.usersettings;
          id = msg.author.id;
        } else {
          throw new Error("invalid command config type");
        }

        if (args[0]) {
          bot._.set(settings, id + "." + cmd.setting, args[0]);
        }

        bot.send(msg, cmd.verbose, `\`\`\`js\n${bot._.get(settings, id + "." + cmd.setting)}\`\`\``);
      }
    });
  };

  bot.registerCommandConfigBool = function (cmd) {
    bot.registerCommand({
      name: cmd.name,
      category: cmd.category || cmd.permission,
      info: {
        args: "[on/off]",
        description: `enables/disables ${cmd.verbose}`
      },
      generator: (msg, args) => {
        let id, settings;

        if (cmd.permission === "guild") {
          if (!bot.checkPerm(msg, "manageGuild")) {
            return;
          }
          settings = bot.guildsettings;
          id = [msg.channel.guild.id];
        } else if (cmd.permission === "user") {
          settings = bot.usersettings;
          id = msg.author.id;
        } else {
          throw new Error("invalid command config type");
        }

        if (args[0]) {
          switch (args[0]) {
            case "on":
            case "true":
            case "enable":
              bot._.set(settings, id + "." + cmd.setting, true);
            break;
            case "off":
            case "false":
            case "disable":
              bot._.set(settings, id + "." + cmd.setting, false);
            break;
            default:
             bot.send(msg, "what?");
             return;
          }
        }
        bot.send(msg, cmd.verbose, `\`\`\`js\n${bot._.get(settings, id + "." + cmd.setting) === true}\`\`\``);
      }
    });
  };
};