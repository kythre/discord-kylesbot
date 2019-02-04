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
      let guildData = JSON.stringify(bot.guildData.raw, null, 4);
      let userData = JSON.stringify(bot.userData.raw, null, 4);
      let globalData = JSON.stringify(bot.globalData.raw, null, 4);

      try {
        bot.fs.writeFile("./data/guilds.json", guildData, "utf8", () => {
          resolve();
        });
        bot.fs.writeFile("./data/users.json", userData, "utf8", () => {
          resolve();
        });
        bot.fs.writeFile("./data/global.json", globalData, "utf8", () => {
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