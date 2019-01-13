module.exports = (bot) => {
  bot.edit = function (msg, text, embed) {
    bot.editMessage(msg.channel.id, msg.id, bot.embed(msg, text, embed));
  };

  bot.embed = function (msg, text, _embed = {author: {name: text}}) {
    let embed = _embed;
    if (typeof text === "object") {
      embed = text;
    }

    if (typeof embed === "string") {
      embed = {
        description: embed
      };
    }

    // embed.footer = `${msg.author.username}#${msg.author.discriminator}`
    embed.footer = embed.footer || (msg.embeds && msg.embeds[0] ? msg.embeds[0].footer : "");
    embed.footer = embed.footer || {
      text: msg.cmd ? msg.cmd.name : "?"
    };
    embed.author = embed.author || {name: text || embed.title};
    embed.author.name = embed.author.name.replace(/\s/g, "_");
    embed.author.name = bot._.pad(bot.translate(embed.author.name, "Math_monospace"), 75, "_");
    embed.timestamp = embed.timestamp || new Date(msg.timestamp).toISOString();
    embed.color = embed.color || bot.color;

    return {
      embed
    };
  };

  bot.send = function (msg, text, embed) {
    let a = bot.embed(msg, text, embed);
    if (JSON.stringify(a).length > 2048) {
      throw new Error("message too long");
    }
    let nmsg = bot.createMessage(msg.channel.id, a).catch(() => {
      // fail
    });
    nmsg.cmd = msg.cmd;
    return nmsg;
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