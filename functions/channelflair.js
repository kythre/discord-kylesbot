module.exports = (bot) => {
  bot.registerCommand({
    name: "cf",
    category: "guild",
    info: {
      args: "[prefix flair] [postfix flair]",
      description: "adds a flair to all channels"
    },
    generator: async (msg, args) => {

    }
  });

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

      let preFlair = null;
      let postFlair = null;

      if (args[0]) {
        let regexIllegalChars = /^-|!|@|#|\$|%|\^|&|\*|\(|\)|\+|=|\/|\\|\||\{|\}|"|'|<|,|\.|>|\?|:|;|\[|\]|-{2,}/gu;

        preFlair = args[0].replace(regexIllegalChars, "");

        if (args[1]) {
          postFlair = args[1].replace(regexIllegalChars, "");
        } else {
          postFlair = "";
        }

        if (preFlair.length + postFlair.length > 0) {
          let whatido = {can: "",
          cant: "",
          channels: []};
          for (let i of msg.channel.guild.channels) {
            let channel = i[1];
            if (channel.type === 0) {
              if (channel.permissionsOf(bot.user.id).has("readMessages")) {
                whatido.can += `'${channel.name}' -> '${preFlair + channel.name + postFlair}'\n`;
                whatido.channels.push(channel);
              } else {
                whatido.cant += `'${channel.name}'\n`;
              }
            }
          }

          bot.edit(nmsg, "Channel flair legacy", {
            fields: [
              {
                name: "Changing channels to:",
                value: "```js\n" +
                `prefix: '${preFlair}'\n` +
                `postfix: '${postFlair}'\n` +
                `${whatido.can}\`\`\``,
                inline: false
              },
              {
                name: "Cant edit these:",
                value: "```js\n " +
                `${whatido.cant}\`\`\``,
                inline: false
              }
            ]
          });

          await bot.prompt(msg, "continue?", "continue");

          bot.send(nmsg, "Channel flair legacy", {fields: [
            {
              name: "Adding flair",
              value: `\`\`\`js\n'${preFlair}'\n'${postFlair}'\`\`\``,
              inline: false
            }
          ]});

          for (let i of whatido.channels) {
            let channel = i;
            let newname = preFlair + channel.name + postFlair;
            
            try {
              await channel.edit({
                name: newname
              }, "Channel flair");
            } catch (err) {
              bot.send(msg, err);
            }
          }
        }

      } else {
        msg.channel.guild.channels.forEach((channel) => {
          if (channel.type === 0 && channel.permissionsOf(bot.user.id).has("readMessages")) {
            preFlair = findFlair(channel.name, preFlair || channel.name);
            postFlair = findFlair(channel.name.split("").reverse().join(""), postFlair || channel.name.split("").reverse().join(""));
          }
        });

        postFlair = postFlair.split("").reverse().join("");

        // remove prefix flair
        if (preFlair.length > 0 || postFlair.length > 0) {
          let whatido = {can: "",
          cant: "",
          channels: []};
          for (let i of msg.channel.guild.channels) {
            let channel = i[1];
            if (channel.type === 0) {
              if (channel.permissionsOf(bot.user.id).has("readMessages")) {
                whatido.can += `'${channel.name}' -> '${channel.name.substring(preFlair.length, channel.name.length - postFlair.length)}'\n`;
                whatido.channels.push(channel);
              } else {
                whatido.cant += `'${channel.name}'\n`;
              }
            }
          }

          bot.edit(nmsg, "Channel flair legacy", {
            fields: [
              {
                name: "Changing channels to:",
                value: "```js\n" +
                `prefix: '${preFlair}'\n` +
                `postfix: '${postFlair}'\n` +
                `${whatido.can}\`\`\``,
                inline: false
              },
              {
                name: "Cant edit these:",
                value: "```js\n " +
                `${whatido.cant}\`\`\``,
                inline: false
              }
            ]
          });

          await bot.prompt(msg, "continue?", "continue");

          bot.send(nmsg, "Channel flair legacy", {fields: [
              {
              name: "Removing flair",
              value: `\`\`\`js\n'${preFlair}'\n'${postFlair}'\`\`\``,
              inline: false
            }
          ]});

          for (let i of msg.channel.guild.channels) {
            let channel = i[1];

            if (channel.type === 0) {
              let newname = channel.name.substring(preFlair.length, channel.name.length - postFlair.length);

              if (channel.name !== newname) {
                try {
                  await channel.edit({
                    name: newname
                  }, "Channel flair");
                } catch (err) {

                }
              }
            }
          }
        }
      }

      bot.send(nmsg, "Channel flair legacy", {fields: [
        {
          name: "Done",
          value: `\`\`\`js\n'${preFlair}'\n'${postFlair}'\`\`\``,
          inline: false
        }
      ]});
    }
  });
};