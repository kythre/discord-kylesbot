module.exports = (bot) => {
  let alphabet = require("./unicode_alphabet.json");

  bot.translate = function (text, type) {
    let texto = "";

    for (let i in text) {
      if (alphabet[type][text[i].charCodeAt(0) - 33]) {
        texto += alphabet[type][text[i].charCodeAt(0) - 33];
      } else {
        texto += text[i];
      }
    }

    return texto;
  };

  bot.settingsUserSet = function (userid, setting, value) {
    bot.usersettings[userid] = bot.usersettings[userid] || {};
    bot.usersettings[userid][setting] = value;
  };

  bot.guildSettingsSet = function (guildID, setting, value) {
    return bot._.set(bot.guildsettings[guildID], setting, value);
  };

  bot.guildSettingsGet = function (guildID, setting) {
    return bot._.get(bot.guildsettings[guildID], setting) || bot._.get(bot.guildsettingsDefault[guildID], setting);
  };
};