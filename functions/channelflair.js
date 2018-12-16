module.exports = (bot) => {
  bot.registerCommand({
    name: "channelflair",
    category: "guild",
    info: {
      args: "[prefix flair] [postfix flair]",
      description: "adds a flair to all channels"
    },
    generator: async (msg, args) => {

      if (!bot.checkPerm(msg, "manageChannels")) {
        return;
      }

      let nmsg = await bot.send(msg, "Rodger");

      let findFlair = function (iflair, cname) {
        let flair;
        for (let i in cname) {
          if (cname.charAt(i) !== iflair.charAt(i)) {
            flair = iflair.substring(0, i);
          }
        }

        return flair;
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
              await channel.edit({
                name: newname
              }, "Channel flair");
            }
          }
        }

      } else {

        msg.channel.guild.channels.forEach((channel) => {
          if (channel.type === 0) {

            preFlair = findFlair(preFlair === null ? channel.name : preFlair, channel.name);

            postFlair = findFlair(postFlair === null ? channel.name.split("").reverse().join("") : postFlair, channel.name.split("").reverse().join(""));
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
            let newname = channel.name;

            if (preFlair.length > 0) {
              newname = newname.substring(preFlair.length);
            }

            if (postFlair.length > 0) {
              newname = newname.substring(0, newname.length - postFlair.length);
            }

            if (channel.type === 0) {
              await channel.edit({
                name: newname
              }, "Channel flair");
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