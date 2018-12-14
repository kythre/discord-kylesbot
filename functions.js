module.exports = (bot) => {
  bot.audit = function () {

    return new Promise((resolve, reject) => {
      require("fs").readdir("./commands/", {
        withFileTypes: true
      }, async (err, files) => {
        if (err) {
          reject();
        }

        for (let i in files) {
          let file = files[i];
          let path = `./commands/${file.name}`;

          if (!file.isDirectory()) {
            let regexJSFile = /(\.js)$/gi;
            if (file.name.match(regexJSFile)) {
              require(path)(bot);

              try {
                delete require.cache[require.resolve(path)];
              } catch (err) {
                bot.log.err(err.stack, "youre fucking stupid");
              }
            }
          }
        }
        resolve();
      });
    });
  };

  bot.checkPerm = function (msg, perm) {

    if (!msg.channel.guild.members.get(msg.author.id).permission.has(perm)) {
      bot.commandDeny(msg, {
        reason: "MISSING_PERM",
        user: msg.author,
        perm
      });
      return false;
    }
    if (!msg.channel.guild.members.get(bot.user.id).permission.has(perm)) {
      bot.commandDeny(msg, {
        reason: "MISSING_PERM",
        user: bot.user,
        perm
      });
      return false;
    }
    return true;
  };

  bot.commandDeny = function (msg, info) {

    let reason;
    let specific;
    let user;

    if (typeof msg === "string") {
      reason = info;
    } else {
      reason = info.reason;
      user = info.user;
      specific = info.perm;
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

    bot.send(msg, "negatory");
  };

  bot.edit = function (msg, content) {
    bot.editMessage(msg.channel.id, msg.id, bot.embed(msg, content));
  };

  bot.embed = function (msg, content) {
    let embed;

    if (typeof content === "string") {
      embed = {
        description: content
      };
    } else {
      embed = content;
    }

    // embed.footer = `${msg.author.username}#${msg.author.discriminator}`
    embed.footer = msg.cmd.name;
    embed.footer = {
      text: embed.footer
    };
    embed.timestamp = embed.timestamp || new Date(msg.timestamp).toISOString();
    embed.color = embed.color || bot.color;

    return {
      embed
    };
  };

  bot.registerCommand = function (cmd) {

    if (bot.commands[cmd.name]) {
      bot.log.warn(`Overwriting command: ${cmd.name} ${cmd.path}`);
    }

    bot.commands[cmd.name] = cmd;

    bot.log.log(`${cmd.name} ${cmd.path}`, "Command registered:");
  };

  bot.save = function () {

    return new Promise((resolve, reject) => {

      let json = JSON.stringify(bot.guildSettings, null, 4);

      bot.fs.writeFile("./data/guilds.json", json, "utf8", () => {
        resolve();
      }).catch(() => {
        reject();
      });
    });
  };

  bot.send = function (msg, content) {
    bot.createMessage(msg.channel.id, bot.embed(msg, content));
  };
};