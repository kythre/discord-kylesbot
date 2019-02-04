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

  bot.findMember = function (guild_, user) {
    let guild;
    let member;

    if (guild_.match && guild_.match(/^[0-9]{18}$/)) {
      guild = bot.guilds.get(guild_);
    }

    if (guild_.members) {
      guild = guild_;
    }

    const members = guild.members;
  
    if (user.match(/(?!<@!?)[0-9]{18}(?=>)/)) {
      user = user.match(/(?!<@!?)[0-9]{18}(?=>)/)[0];
    }

    if (user.match(/^[0-9]{18}$/)) {
      member = members.get(user);
    }

    if (member) {
      return [member];
    }

    // match nickname or username exactly
    member = members.filter((a) => ((a.nick && a.nick.toLowerCase() === user.toLowerCase()) || (a.username.toLowerCase() === user.toLowerCase())));

    if (member[0]) {
      return member;
    }

    // match nickname or username beginning
    member = members.filter((a) => (a.nick && a.nick.toLowerCase().startsWith(user.toLowerCase())) || (a.username.toLowerCase().startsWith(user.toLowerCase())));

    if (member[0]) {
      return member;
    }

    // match nickname or username partially
    member = members.filter((a) => (a.nick && a.nick.toLowerCase().includes(user.toLowerCase())) || (a.username.toLowerCase().includes(user.toLowerCase())));

    if (member[0]) {
      return member;
    }
  };
};