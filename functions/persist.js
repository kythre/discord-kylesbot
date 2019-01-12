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

    bot.guildsettings[guild.id].membercache[member.id] = {
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

    let guildsettings = bot.guildsettings[guild.id];
    let membercache = guildsettings.membercache[member.id];

    if (membercache && (guildsettings.persist.nick || guildsettings.persist.roles)) {
      await setTimeout(async () => {
        try {
          await member.edit({
            roles: guildsettings.persist.roles ? membercache.roles : member.roles,
            nick: guildsettings.persist.nick ? membercache.nick : member.nick
          }, "Persist");
        } catch (err) {
          bot.error("Persists", err);
        }
      }, 250);
    }
  });
};