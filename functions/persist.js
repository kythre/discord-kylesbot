let cacheMember = function (guild, member) {
  if (member.bot) {
    return;
  }

  guild.settings.memberCache[member.id] = {
    nick: member.nick,
    roles: member.roles
  };
};

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

  bot.on("guildMemberRemove", cacheMember);
  bot.on("guildMemberUpdate", cacheMember);

  bot.on("guildMemberAdd", (guild, member) => {
    if (member.bot) {
      return;
    }

    let guildSettings = bot.guildSettings[guild.id];
    let memberCache = guildSettings.memberCache[member.id];

    if (memberCache && (guildSettings.persist.nick || guildSettings.persist.nick)) {
      try {
        member.edit({
          roles: guildSettings.persist.roles ? memberCache.roles : member.roles,
          nick: guildSettings.persist.nick ? memberCache.nick : member.nick
        }, "Persist");
      } catch (err) {
        bot.error("Persists", err);
      }
    }
  });
};