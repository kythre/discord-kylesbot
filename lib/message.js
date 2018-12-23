module.exports = (bot) => {
  bot.edit = function (msg, content) {
    bot.editMessage(msg.channel.id, msg.id, bot.embed(msg, content));
  };

  bot.embed = function (msg, text, embed = {title: text}) {
    if (typeof embed === "string") {
      embed = {
        description: embed
      };
    }

    // embed.footer = `${msg.author.username}#${msg.author.discriminator}`
    embed.footer = embed.footer || msg.embeds[0] ? msg.embeds[0].footer : "";
    embed.footer = embed.footer || {
      text: msg.cmd ? msg.cmd.name : msg.content.split(" ")[0]
    };
    embed.title = embed.title || text;
    embed.title = bot._.pad(embed.title, 64, "ﾠ");
    embed.timestamp = embed.timestamp || new Date(msg.timestamp).toISOString();
    embed.color = embed.color || bot.color;

    return {
      embed
    };
  };

  bot.send = function (msg, text, embed) {
    let nmsg = bot.createMessage(msg.channel.id, bot.embed(msg, text, embed));
    nmsg.cmd = msg.cmd;
    return nmsg;
  };

  bot.prompt = function (msg, question, _exptected = {match: null,
    message: ""}) {
    
    switch (toString.call(_exptected)) {
      case "[object Array]":
        expected = _exptected.join("`, `");
        _exptected.push("cancel");
      break;

      default:
      break;
    }

    bot.send(msg, question, `\`${expected}\``);

    return new Promise((resolve, reject) => {
      let prompt = (imsg) => {
        let res = function (i) {
          delete msg.channel.prompt;
          clearTimeout(timeout);

          if (!i) {
            reject(new Error("timeout"));
          }

          if (i === "cancel") {
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

        switch (toString.call(_exptected)) {
          case "[object Array]":
            if (_exptected.includes(imsg.content.toLowerCase())) {
              res(imsg.content.toLowerCase());
            } else {
              bot.send(msg, "bad answer", `\`${expected}\``);
            }
          break;
          case "[object RegExp]":
            if (_exptected.match(imsg.content)) {
              res(imsg.content);
            }
          break;

          default:
            res(imsg.content);
          break;
        }
      };

      msg.channel.prompt = prompt;
    });
  };
};