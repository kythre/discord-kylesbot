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
  bot.on("guildMemberRemove", cacheMember);
  bot.on("guildMemberUpdate", cacheMember);

  bot.on("guildMemberAdd", (guild, member) => {

    if (member.bot) {
      return;
    }

    let memberCache = guild.settings.memberCache[member.id];

    if (memberCache) {
      try {
        member.edit({
          roles: memberCache.roles,
          nick: memberCache.nick
        }, "Persist");
      } catch (err) {}
    }
  });
};