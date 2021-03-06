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

  bot.registerCommand = function (cmd, generator, options) {
    if (typeof cmd === "string") {
      bot.commands.push(new bot.eris.Command(cmd, generator, options));
      bot.log.log(cmd, "Command registered:");
      return;
    }

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

  bot.registerCommandConfigBool = (cmd) => bot.registerCommandConfig(cmd, "bool");
  bot.registerCommandConfigInt = (cmd) => bot.registerCommandConfig(cmd, "int");
  bot.registerCommandConfigStr = (cmd) => bot.registerCommandConfig(cmd, "str");
  bot.registerCommandConfig = (cmd, type) => bot.registerCommand({
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
        settings = bot.guildData.raw;
        id = msg.channel.guild.id;
      } else if (cmd.permission === "user") {
        settings = bot.userData.raw;
        id = msg.author.id;
      } else {
        throw new Error("invalid command config type");
      }

      if (args[0]) {
        switch (type) {
          case "bool":
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
            break;

          case "int":
            if (args[0].match(/^[0-9]+$/)) {
              bot._.set(settings, id + "." + cmd.setting, parseInt(args[0], 10));
            } else {
              bot.send(msg, cmd.verbose, "thats no number");
              return;
            }
            break;

          case "str":
            bot._.set(settings, [
              id,
              cmd.setting
            ], args[0]);
          break;

          default:
            throw new Error("invalid command config type");
        }
      }

      bot.send(msg, cmd.verbose, `\`\`\`yaml\n${bot.guildData.get(id, cmd.setting)}\`\`\``);
    }
  });

  //
  // reaction button handling below
  //
  bot.reactionActions = {
    cancel: async (msg) => {
        bot.unwatchMessage(msg.channel.id, msg.id);
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

  bot.unwatchMessage = function (channelID, id) {
    bot.getMessage(channelID, id).then((msg) => {
      bot.globalData.set("activeMessages", [
        msg.channel.id,
        msg.id
      ], null);
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

  bot.onMessageReactionEvent = async function (msg_, emoji_, userID) {
    if (!bot.ready || userID === bot.user.id) {
        return;
    }

    let activeMessage = bot.globalData.get("activeMessages", [
      msg_.channel.id,
      msg_.id
    ]);

    if (activeMessage) {
      if (activeMessage.timeout && activeMessage.timeout < Date.now()) {
        bot.unwatchMessage(msg_.channel.id, msg_.id);
        return;
      }

      const emoji = emoji_.id ? `${emoji_.name}:${emoji_.id}` : emoji_.name;
      let msg = msg_;

      if (!(msg.content || msg.embeds || msg.attachments)) {
          msg = await bot.getMessage(msg.channel.id, msg.id);
      }

      msg.command = bot.getCommand(activeMessage.command);
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

  bot.on("messageReactionAdd", bot.onMessageReactionEvent);
  // bot.on("messageReactionRemove", bot.onMessageReactionEvent);
};