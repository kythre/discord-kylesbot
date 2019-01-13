module.exports = (bot) => {
  bot.buildsettings = function (guild) {
    bot.guildsettings[guild.id] = bot.guildsettings[guild.id] || {};
    for (let i in bot.guildsettingsDefault) {
        bot.guildsettings[guild.id][i] = bot.guildsettings[guild.id][i] || bot.guildsettingsDefault[i];
    }
  };

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
};