module.exports = (bot) => {
  bot.embed = function (msg, primary, secondary) {
    let embed = {};

    // if we are given an embed straight up
    if (typeof primary === "object") {
      embed = primary;

    // if we are given a title first or just a line of text to send
    } else if (typeof primary === "string") {

      // im using the description to display titles/single lines of text because it supports markup/emotes/pings
      embed.description = primary;
      // change the font to fixed width (for style and formatting), then pad with a unicode space to center it
      embed.description = bot._.pad(bot.translate(embed.description, "Math_monospace"), embed.thumbnail ? 35 : 36, "ㅤ");

      // if we are then given a string to display under our title
      if (typeof secondary === "string") {
        // concatenate it with a newline under our description for the same reasons
        embed.description += "\n" + secondary;

      // if we are then given an embed to put under our title
      } else if (typeof secondary === "object") {
        // use the embed
        embed = secondary;

        // re-add the title if there was one
        embed.description = bot._.pad(bot.translate(primary, "Math_monospace"), embed.thumbnail ? 35 : 36, "ㅤ") + (embed.description ? "\n" + embed.description : "");
      }
    }

    // fill empty args with old embed args if applicable
    // for if were edting/replacing an embed
    // bot._.defaultsDeep(embed, bot._.get(msg, "embeds")[0] || {});

    // fill defaults
    // default to our standard embed args
    bot._.defaultsDeep(embed, {
      // author: {name: text},
      footer: {text: msg.command ? msg.command.label : "?"},
      timestamp: new Date(msg.timestamp).toISOString(),
      color: bot.color
    });

    // embed.footer = `${msg.author.username}#${msg.author.discriminator}`
    // "_"
    // embed.author.name = embed.author.name.replace(/\s/g, "⁓");
    // embed.author.name = bot._.pad(bot.translate(embed.author.name, "Math_monospace"), embed.thumbnail ? 50 : 60, "⁓");

    embed.description = embed.description.substring(0, 1900);

    if (JSON.stringify(embed).length > 2048) {
      throw new Error("message too long");
    }

    return {
      embed
    };
  };

  bot.edit = function (msg, text, embed) {
    return new Promise((resolve, reject) => {
      bot.editMessage(msg.channel.id, msg.id, bot.embed(msg, text, embed)).then(resolve).catch(reject);
    });
  };

  bot.send = function (msg, text, embed) {
    return new Promise((resolve, reject) => {
      bot.createMessage(msg.channel.id, bot.embed(msg, text, embed)).then((nmsg) => {
        nmsg.command = msg.command;
        resolve(nmsg);
      }).catch(reject);
    });
  };

  bot.prompt = function (msg, question, _exptected) {
    let string = "";
    let expected = _exptected;
    switch (toString.call(expected)) {
      case "[object Array]":
        expected.push("cancel");
        string = expected.join("`, `");
      break;

      case "[object Object]":
      break;

      case "[object String]":
        switch (expected) {
          case "continue":
            expected = [
              "yes",
              "no"
            ];
            string = expected.join("`, `");
          break;

          default:
          break;
        }
      break;

      case "[object RegExp]":
      break;

      default:
      break;
    }

    bot.send(msg, question, `\`${string}\``);

    return new Promise((resolve, reject) => {
      msg.channel.prompt = (imsg) => {
        let res = function (i) {
          delete msg.channel.prompt;
          clearTimeout(timeout);

          if (!i) {
            reject(new Error("timeout"));
          }

          if (i === "cancel") {
            reject(new Error("cancelled"));
          }

          if (_exptected === "continue" && i === "no") {
            reject(new Error("cancelled"));
          }

          resolve(i);
        };

        let timeout = setTimeout(res, 60000);

        if (msg.author !== imsg.author) {
          return;
        }

        if (msg.channel !== imsg.channel) {
          return;
        }

        if (imsg.content.toLowerCase() === "cancel") {
          res("cancel");
        }

        switch (toString.call(expected)) {
          case "[object Array]":
            if (expected.includes(imsg.content.toLowerCase())) {
              res(imsg.content.toLowerCase());
            } else {
              bot.send(msg, "bad answer. expected:", `\`${string}\``);
            }
          break;
          case "[object RegExp]":
            if (expected.match(imsg.content)) {
              res(imsg.content);
            }
          break;

          default:
            res(imsg.content);
          break;
        }
      };
    });
  };
};