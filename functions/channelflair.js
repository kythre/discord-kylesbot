module.exports = (bot) => {
  // bot.registerCommand({
  //   name: "cf",
  //   category: "guild",
  //   info: {
  //     args: "[prefix flair] [postfix flair]",
  //     description: "adds a flair to all channels"
  //   },
  //   generator: async (msg, args) => {
  //     // complex channel flair
  //   }
  // });

  bot.registerCommand({
    name: "cfs",
    category: "guild",
    info: {
      name: "simple channel flair",
      args: "[prefix flair] [postfix flair]",
      description: "adds a flair to all channels\n" +
      "this bot can only affect channels it has access to\n" +
      "requires admin permissions or read permissions for each channel"
    },
    generator: async (msg, args) => {
      if (!bot.checkPerm(msg, "manageChannels")) {
        return;
      }

      let nmsg = await bot.send(msg, "Rodger");
      let preFlair = null;
      let postFlair = null;
      let addingFlair = typeof args[0] !== "undefined";
      let regexIllegalChars = /!|@|#|\$|%|\^|&|\*|\(|\)|\+|=|\/|\\|\||\{|\}|"|'|<|,|\.|>|\?|:|;|\[|\]|-{2,}/gu;
      let whatido = {can: " ",
      cant: " ",
      channels: []};

      // find flair to add or remove
      if (addingFlair) {
        preFlair = args[0].replace(regexIllegalChars, "");
        preFlair = preFlair.replace(/^-/gu, "");

        if (args[1]) {
          postFlair = args[1].replace(regexIllegalChars, "");
          postFlair = postFlair.replace(/-$/gu, "");
        } else {
          postFlair = "";
        }
      } else {
        let findFlair = function (cname, flair) {
          let oflair = flair;

          for (let i in cname) {
            if (cname[i] !== flair[i]) {
              oflair = flair.substring(0, i);
              break;
            }
          }

          return oflair;
        };

        msg.channel.guild.channels.forEach((channel) => {
          if (channel.type === 0 && channel.permissionsOf(bot.user.id).has("readMessages")) {
            preFlair = findFlair(channel.name, preFlair || channel.name);
            postFlair = findFlair(channel.name.split("").reverse().join(""), postFlair || channel.name.split("").reverse().join(""));
          }
        });

        postFlair = postFlair.split("").reverse().join("");
      }

      // audit channels for flair change
      if (preFlair.length + postFlair.length > 0) {
        for (let i of msg.channel.guild.channels) {
          let channel = i[1];
          if (channel.type === 0) {
            if (channel.permissionsOf(bot.user.id).has("readMessages")) {
              if (addingFlair) {
                whatido.can += `'${channel.name}' -> '${preFlair + channel.name + postFlair}'\n`;
                whatido.channels.push(channel);
              } else {
                // whatido.can += `'${channel.name}' -> '${channel.name.substring(preFlair.length, channel.name.length - postFlair.length)}'\n`;
                // whatido.channels.push(channel)

                let newname = channel.name;
                if (newname.startsWith(preFlair)) {
                  newname = newname.substring(preFlair.length, newname.length);
                }

                if (newname.endsWith(postFlair)) {
                  newname = newname.substring(0, newname.length - postFlair.length);
                }

                if (channel.name !== newname) {
                  whatido.can += `'${channel.name}' -> '${newname}'\n`;
                  whatido.channels.push(channel);
                }
              }
            } else {
              whatido.cant += `'${channel.name}'\n`;
            }
          }
        }

      }

      if (whatido.channels.length === 0) {
        bot.send(nmsg, "simple channel flair", "nothing to change");
        return;
      }

      bot.edit(nmsg, "simple channel flair", {
        fields: [
          {
            name: "Flair:",
            value: "```js\n" +
            `prefix: '${preFlair}'\n` +
            `postfix: '${postFlair}'\`\`\``
          },
          {
            name: "Changing channels to:",
            value: "```js\n" +
            `${whatido.can}\`\`\``
          },
          {
            name: "I have no access to these channels:",
            value: "```js\n " +
            `${whatido.cant}\`\`\``
          }
        ]
      });

      await bot.prompt(msg, "continue?", "continue");

      nmsg = await bot.send(nmsg, "simple channel flair", {fields: [
          {
          name: `${addingFlair ? "Adding" : "Removing"} flair`,
          value: `\`\`\`js\n'${preFlair}'\n'${postFlair}'\`\`\``,
          inline: false
        }
      ]});

      for (let i of whatido.channels) {
        let channel = i;
        let newname;

        if (addingFlair) {
          newname = preFlair + channel.name + postFlair;
        } else {
          newname = channel.name.substring(preFlair.length, channel.name.length - postFlair.length);
        }

        if (channel.name !== newname) {
          try {
            await channel.edit({
              name: newname
            }, "Channel flair");
          } catch (err) {
            bot.send(msg, err);
          }
        }
      }

      bot.edit(nmsg, "simple channel flair", {fields: [
        {
          name: "Done",
          value: `\`\`\`js\n'${preFlair}'\n'${postFlair}'\`\`\``,
          inline: false
        }
      ]});
    }
  });
};