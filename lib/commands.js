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
      case "USER_BLACKLISTED":
        reason = "fuck you, buddy";
        break;
      case "SERVER_ONLY":
        reason = "hey you cant do that here";
        break;
      case "OWNER_ONLY":
        reason = "nope, cant make me";
        break;
      case "MISSING_PERM":
        reason = (user ? user.username + " " : "") + "dont have permission" + (specific ? " " + specific : "");
        break;
      case "CURRENTLY_RUNNING":
        reason = "holy shit calm down, another command is already running";
        break;
      default:
        reason = "negatory " + (user ? user.username + " " : "") + reason + (specific ? " " + specific : "");
        break;
    }

    bot.send(msg, reason).then((nmsg) => {
      nmsg.timer = setTimeout(() => nmsg.delete().catch(() => {
        // catch
      }), 3000);
    });
  };

  bot.registerCommand = function (cmd) {

    if (bot.commands[cmd.name]) {
      bot.log.warn(cmd.name, "Overwriting command:");
    } else {
      bot.log.log(cmd.name, "Command registered:");
    }

    const Command = require("eris").Command;
    bot.commands.push(new Command(cmd.name, cmd.generator, {
      fullDescription: cmd.info.description,
      guildOnly: cmd.category === "guild",
      requirements: cmd.category === "bot owner" ? {userIDs: [bot.owner]} : null,
      description: cmd.category,
      usage: cmd.info.args
    }));
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

  bot.registerCommandConfigInt = function (cmd) {
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
          if (args[0].match(/^[0-9]+$/)) {
            bot._.set(settings, id + "." + cmd.setting, parseInt(args[0], 10));
          } else {
            bot.send(msg, cmd.verbose, "thats no number");
            return;
          }
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