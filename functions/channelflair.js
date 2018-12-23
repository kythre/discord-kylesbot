module.exports = (bot) => {
  bot.registerCommand({
    name: "cf",
    category: "guild",
    info: {
      args: "[prefix flair] [postfix flair]",
      description: "adds a flair to all channels"
    },
    generator: async (msg, args) => {

      let test = await bot.prompt(msg, "yes or no", [
        "yes",
        "no"
      ]);

      return;


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
          bot.edit(nmsg, {
            fields: [
              {
                name: "Adding flair:",
                value: `\`\`\`js\n'${preFlair}'\n'${postFlair}'\`\`\``,
                inline: false
              }
            ]
          });

          for (let i of msg.channel.guild.channels) {
            let channel = i[1];
            let newname = preFlair + channel.name + postFlair;
            
            if (channel.type === 0) {
              try {
                await channel.edit({
                  name: channel.cname
                }, "Channel flair");
                console.log("succ", channel.name, channel.permissionsOf(bot.user.id).allow)
              } catch (err) {
                console.log("fail", channel.name, channel.permissionsOf(bot.user.id).allow)
              }
            }
          }
        }

      } else {
        msg.channel.guild.channels.forEach((channel) => {
          if (channel.type === 0) {
            preFlair = findFlair(channel.name, preFlair || channel.name);
            postFlair = findFlair(channel.name.split("").reverse().join(""), postFlair || channel.name.split("").reverse().join(""));
          }
        });

        postFlair = postFlair.split("").reverse().join("");

        // remove prefix flair
        if (preFlair.length > 0 || postFlair.length > 0) {

          bot.edit(nmsg, {fields: [
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

      bot.edit(nmsg, {fields: [
        {
          name: "Done",
          value: `\`\`\`js\n'${preFlair}'\n'${postFlair}'\`\`\``,
          inline: false
        }
      ]});
    }
  });
};