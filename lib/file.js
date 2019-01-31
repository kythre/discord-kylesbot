module.exports = (bot) => {
  bot.audit = function () {
    return new Promise((resolve, reject) => {
      bot.fs.readdir("./functions/", {
        withFileTypes: true
      }, async (err, files) => {
        if (err) {
          reject(err);
        }

        for (let i in files) {
          let file = files[i];
          let path = `../functions/${file.name}`;

          if (!file.isDirectory()) {
            let regexJSFile = /(\.js)$/gi;
            if (file.name.match(regexJSFile)) {
              require(path)(bot);
            }
          }
        }
        resolve();
      });
    });
  };

  bot.save = function () {
    return new Promise((resolve, reject) => {
      let guildsettings = JSON.stringify(bot.guildsettings, null, 4);
      let usersettings = JSON.stringify(bot.usersettings, null, 4);
      let activeMessages = JSON.stringify(bot.activeMessages, null, 4);

      try {
        bot.fs.writeFile("./data/guilds.json", guildsettings, "utf8", () => {
          resolve();
        });
        bot.fs.writeFile("./data/users.json", usersettings, "utf8", () => {
          resolve();
        });
        bot.fs.writeFile("./data/activeMessages.json", activeMessages, "utf8", () => {
          resolve();
        });
        resolve();
      } catch (err) {
        bot.log.err(err, "bot.save");
        reject(err);
      }
    });
  };
};