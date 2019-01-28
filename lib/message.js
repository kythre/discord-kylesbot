module.exports = (bot) => {
  bot.embed = function (msg, text, _embed) {
    let embed = {author: {name: text}};
    let oldembed = bot._.get(msg, "embeds")[0] || {};

    if (typeof text === "object") {
      embed = text;
    }

    if (typeof _embed === "string") {
      embed = {
        description: _embed
      };
    }

    bot._.defaultsDeep(embed, _embed);
    bot._.defaultsDeep(embed, oldembed);
    bot._.defaultsDeep(embed, {
      author: {name: text || embed.title},
      footer: {text: msg.command ? msg.command.label : "?"},
      timestamp: new Date(msg.timestamp).toISOString(),
      color: bot.color
    });

    // embed.footer = `${msg.author.username}#${msg.author.discriminator}`
    // "_"
    // embed.author.name = embed.author.name.replace(/\s/g, "⁓");
    // embed.author.name = bot._.pad(bot.translate(embed.author.name, "Math_monospace"), embed.thumbnail ? 50 : 60, "⁓");
    embed.author.name = bot._.pad(bot.translate(embed.author.name, "Math_monospace"), embed.thumbnail ? 35 : 36, "ㅤ");

    return {
      embed
    };
  };

  bot.edit = function (msg, text, embed) {
    return new Promise((resolve, reject) => {
      let a = bot.embed(msg, text, embed);
      if (JSON.stringify(a).length > 2048) {
        reject(new Error("message too long"));
      }
      bot.editMessage(msg.channel.id, msg.id, a).then(resolve).catch(reject);
    });
  };

  bot.send = function (msg, text, embed) {
    return new Promise((resolve, reject) => {
      let a = bot.embed(msg, text, embed);
      if (JSON.stringify(a).length > 2048) {
        reject(new Error("message too long"));
      }
      bot.createMessage(msg.channel.id, a).then((nmsg) => {
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