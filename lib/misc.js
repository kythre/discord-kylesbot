module.exports = (bot) => {
  let alphabet = require("./unicode_alphabet.json");

  bot.translate = function (text_, type) {
    let text = text_.toString();
    let texto = "";

    let regex = new RegExp("<[^<>]+>", "ig");
    let matches = regex.exec(text);

    if (matches) {
      matches.forEach((match, index, m) => {
        let a = [
          text.slice(0, m.index),
          text.slice(m.index, m.index + m[0].length),
          text.slice(m.index + m[0].length)
        ].map((e) => {
          if (!regex.test(e)) {
            let out = "";
            for (let i in e) {
              if (alphabet[type][e[i].charCodeAt(0) - 33]) {
                out += alphabet[type][e[i].charCodeAt(0) - 33];
              } else {
                out += e[i];
              }
            }
            return out;
          }

          return e;
        });
        texto = a.join("");
      });
    } else {
      for (let i in text) {
        if (alphabet[type][text[i].charCodeAt(0) - 33]) {
          texto += alphabet[type][text[i].charCodeAt(0) - 33];
        } else {
          texto += text[i];
        }
      }
    }

    return texto;
  };

  // settings getters should have a default arguemnt that combines with the saved settings using lodash defaultsdeep

  bot.userSettingsSet = function (userid, setting, value) {
    bot.usersettings[userid] = bot.usersettings[userid] || {};
    bot._.set(bot.usersettings[userid], setting, value);
  };

  bot.userSettingsGet = function (userid, setting) {
    return bot._.get(bot.usersettings[userid], setting);
  };

  bot.guildSettingsSet = function (guildID, setting, value) {
    bot.guildsettings[guildID] = bot.guildsettings[guildID] || {};
    bot._.set(bot.guildsettings[guildID], setting, value);
  };

  bot.guildSettingsGet = function (guildID, setting) {
    return bot._.get(bot.guildsettings[guildID], setting) || bot._.get(bot.guildsettingsDefault, setting);
  };
};