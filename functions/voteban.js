module.exports = (bot) => {

  bot.registerCommand({
    name: "voteban",
    category: "guild",
    info: {
      args: "[badboy]",
      description: "voteban a badboy"
    },
    generator: async (msg) => {
      if (!bot.checkPerm(msg, "banMembers")) {
        return;
      }
      let finalize = async function (mid, uid) {
        await msg.channel.getMessage(mid).then(async (m) => {
          let out = {yes: 0,
            no: 0,
            bool: null,
            tie: false};

          if (!m.reactions["✅"] || !m.reactions["❌"]) {
            out.bool = false;
          } else {
            out.bool = m.reactions["✅"].count > m.reactions["❌"].count;
            out.tie = m.reactions["✅"].count === m.reactions["❌"].count;

            out.yes = m.reactions["✅"].count - 1;
            out.no = m.reactions["❌"].count - 1;
          }

          if (out.bool && !out.tie) {
            await m.removeReactions();
            await bot.edit(m, {title: "Vote passed.",
            escription: `The vote passed with ${out.yes} vote(s) over ${out.no}.`,
            color: 0x42C0FB});
            await bot.banGuildMember(m.channel.guild.id, uid, 0, "That boy lost a fuckin' vote-ban. Everyone probably just hated 'em.");
          } else if (!out.bool && !out.tie) {
            await m.removeReactions();
            await bot.edit(m, {title: "Vote failed.",
            description: `The vote failed with ${out.no} vote(s) over ${out.yes}.`,
            color: 0xff0000});
          } else if (out.tie) {
            await m.removeReactions();
            await bot.edit(m, {title: "Vote tied.",
            description: `The vote tied with ${out.yes} votes.`,
            color: 0x42C0FB});
          }
        });
      };

      let u;
      if (msg.mentions[0]) {
        if (msg.channel.guild.members.get(msg.mentions[0].id)) {
          u = msg.mentions[0];
        } else {
          return;
        }
      } else {
        return;
      }

      let mid;
      await bot.send(msg, "Oh shit! It's a vote-ban!", {
        author: {icon_url: msg.author.avatarURL},
        description: `<@${msg.author.id}> proposes that <@${u.id}> be banned.`,
        thumbnail: {url: u.avatarURL},
      timestamp: new Date().toISOString(),
        color: 0x42C0FB
      }).then(async (m) => {
        mid = m.id;

        await m.addReaction("✅");
        await m.addReaction("❌");
      });

      setTimeout(() => {
        finalize(mid, u.id);
      }, 30000);
    }
  });
};