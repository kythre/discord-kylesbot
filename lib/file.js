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

              try {
                delete require.cache[require.resolve(path)];
              } catch (errr) {
                bot.log.err(errr.stack, "youre fucking stupid");
              }
            }
          }
        }
        resolve();
      });
    });
  };

  bot.save = function () {
    return new Promise((resolve, reject) => {
      let json = JSON.stringify(bot.guildsettings, null, 4);
      try {
        bot.fs.writeFile("./data/guilds.json", json, "utf8", () => {
          resolve();
        });
      } catch (err) {
        bot.log.err(err, "bot.save");
        reject(err);
      }
    });
  };
};