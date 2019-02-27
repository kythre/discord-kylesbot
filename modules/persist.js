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

    bot.guildData.set(guild.id, "membercache." + member.id, {
      nick: member.nick,
      roles: member.roles
    });
  };

  bot.on("guildMemberRemove", cacheMember);
  bot.on("guildMemberUpdate", cacheMember);
  bot.on("guildMemberAdd", (guild, member) => {

    let persistNick = bot.guildData.get(guild.id, "persist.nick");
    let persistRoles = bot.guildData.get(guild.id, "persist.roles");
    let membercache = bot.guildData.get(guild.id, [
      "membercache",
      member.id
    ]);

    if (membercache && (persistNick || persistRoles)) {
      setTimeout(() => {
        member.edit({
//          roles: persistRoles ? member.roles.concat(membercache.roles) : member.roles,
          roles: persistRoles ? membercache.roles : member.roles,
          nick: persistNick ? membercache.nick : member.nick
        }, "Persist").catch({
        });
      }, 1000);
    }
  });
};