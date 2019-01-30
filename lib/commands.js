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

  // reaction button handling below

  bot.reactionActions = {
  cancel: async (msg) => {
      bot.unwatchMessage(msg.id, msg.channel.id);
  },
  edit: (msg, action, userID) => {
      msg.removeReaction(action.emoji, userID).catch(() => {
          // catch
      });

      let resp;

      if (Array.isArray(action.response)) {
        resp = action.response[Math.floor(Math.random() * action.response.length)];
      }

      if (typeof action.response === "string") {
        resp = action.response;
      }

      if (resp !== null) {
          bot.editMessage(msg.channel.id, msg.id, resp);
      }
  },
  role: async (msg, action, userID) => {
      const member = msg.channel.guild.members.get(userID);

      if (member.roles.includes(action.response)) {
          member.removeRole(action.response);
      } else {
          member.addRole(action.response);
      }
    }
  };

  bot.onMessageReactionEvent = async function (msg_, emoji_, userID) {
    if (!bot.ready || userID === bot.user.id) {
        return;
    }

    if (bot.activeMessages[msg_.channel.guild.id] && bot.activeMessages[msg_.channel.guild.id][msg_.id]) {
        const emoji = emoji_.id ? `${emoji_.name}:${emoji_.id}` : emoji_.name;
        let msg = msg_;

        if (!(msg.content || msg.embeds || msg.attachments)) {
            msg = await bot.getMessage(msg.channel.id, msg.id);
        }

        let activeMessage = bot.activeMessages[msg.channel.guild.id][msg.id];
        msg.command = bot.commands[activeMessage.command];
        let reactionButtons = msg.command.reactionButtons;
        const action = reactionButtons.find((button) => button.emoji === emoji);

        if (!action) {
            return;
        }

        try {
            await bot.reactionActions[action.type](msg, action, userID);
        } catch (err) {} // eslint-disable-line no-empty
    }
  };

  bot.unwatchMessage = function (id, channelID) {
    bot.getMessage(channelID, id).then((msg) => {
      delete bot.activeMessages[msg.channel.guild.id][id];
      if (channelID) {
          bot.removeMessageReactions(channelID, id).catch(() => {
            for (let i in msg.reactions) {
              if (msg.reactions[i].me) {
                  msg.removeReaction(i);
              }
          }
        });
      }
    });
  };
  bot.on("messageReactionAdd", bot.onMessageReactionEvent);
  bot.on("messageReactionRemove", bot.onMessageReactionEvent);
};