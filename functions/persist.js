module.exports = (bot) => {
  bot.registerCommandConfigBool({
    name: "persistroles",
    verbose: "role persist",
    setting: "persist.roles",
    permission: "guild"
  });

  bot.registerCommandConfigBool({
    name: "persistnick",
    verbose: "nickname persist",
    setting: "persist.nick",
    permission: "guild"
  });

  let cacheMember = function (guild, member) {
    if (member.bot) {
      return;
    }

    bot.guildSettingsSet(guild.id, "membercache." + member.id, {
      nick: member.nick,
      roles: member.roles
    });
  };

  bot.on("guildMemberRemove", cacheMember);
  bot.on("guildMemberUpdate", cacheMember);

  bot.on("guildMemberAdd", (guild, member) => {

    let persistNick = bot.guildSettingsGet(guild.id, "persist.nick");
    let persistRoles = bot.guildSettingsGet(guild.id, "persist.roles");
    let membercache = bot.guildSettingsGet(guild.id, "membercache." + member.id);

    if (membercache && (persistNick || persistRoles)) {
      setTimeout(() => {
        try {
          member.edit({
            roles: persistRoles ? membercache.roles : member.roles,
            nick: persistNick ? membercache.nick : member.nick
          }, "Persist");
        } catch (err) {
          bot.error("Persists", err);
        }
      }, 1000);
    }
  });
};