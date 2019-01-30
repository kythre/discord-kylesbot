module.exports = (bot) => {
  bot.commands.push(new bot.eris.Command("clean", (msg, args) => {
    msg.delete().catch(() => {
      // catch
    });
    msg.channel.getMessages(args[0] || 20).then((msgs) => {
      msgs.filter((m) => m.author.id === bot.user.id || m.content.startsWith(bot.guildSettingsGet(m.channel.guild.id, "prefix"))).map((m) => m.delete().catch(() => {
        // catch
      }));
    });
  }, {
    description: "guild",
    fullDescription: "deletes bot/command messages for this bot",
    requirements: {
      permissions: {
        "manageMessages": true
      }
    }
  }));
};