module.exports = (bot) => {
  bot.registerCommandConfig({
    name: "persistroles",
    verbose: "role persist",
    setting: "persist.roles"
  });

  bot.registerCommandConfig({
    name: "persistnick",
    verbose: "nickname persist",
    setting: "persist.nick"
  });

  let cacheMember = function (guild, member) {
    if (member.bot) {
      return;
    }

    bot.guildSettings[guild.id].memberCache[member.id] = {
      nick: member.nick,
      roles: member.roles
    };
  };

  bot.on("guildMemberRemove", cacheMember);
  bot.on("guildMemberUpdate", cacheMember);

  bot.on("guildMemberAdd", async (guild, member) => {
    if (member.bot) {
      return;
    }

    let guildSettings = bot.guildSettings[guild.id];
    let memberCache = guildSettings.memberCache[member.id];

    if (memberCache && (guildSettings.persist.nick || guildSettings.persist.roles)) {
      await setTimeout(async () => {
        try {
          await member.edit({
            roles: guildSettings.persist.roles ? memberCache.roles : member.roles,
            nick: guildSettings.persist.nick ? memberCache.nick : member.nick
          }, "Persist");
        } catch (err) {
          bot.error("Persists", err);
        }
      }, 250);
    }
  });
};