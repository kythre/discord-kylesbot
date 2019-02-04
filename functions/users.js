module.exports = (bot) => {
  let addTag = function (userID, tag) {
    let userTags = bot.userData.get(userID, "tags") || [];
    if (Array.isArray(tag)) {
      for (let i in tag) {
        userTags.push(tag[i]);
      }
    } else {
      userTags.push(tag);
    }
    bot.userData.set(userID, "tags", userTags);
  };

  let remTag = function (userID, tag) {
    let userTags = bot.userData.get(userID, "tags") || [];
    if (Array.isArray(tag)) {
      for (let i in tag) {
        userTags = userTags.filter((value) => value !== tag[i]);
      }
    } else {
      userTags = userTags.filter((value) => value !== tag);
    }
    bot.userData.set(userID, "tags", userTags);
  };

  let tag = function (msg, args, operation) {
    let loserID;

    if (msg.mentions[0] && !msg.mentions[0].bot) {
      loserID = msg.mentions[0].id;
    }

    if (args[0] && args[0].match(/^([0-9]{18})$/)) {
      loserID = args[0];
    }

    if (loserID && args[1]) {
      args.shift();
      if (operation) {
        addTag(loserID, args);
      } else {
        remTag(loserID, args);
      }
      return bot.send(msg, `\`${loserID}\` ${operation ? "" : "un"}tagged.`);
    }

    return bot.send(msg, msg.author.username + ", ya dumb");
  };

  bot.registerCommand("taguser", (msg, args) => tag(msg, args, true), {
    fullDescription: "tag a bitch",
    guildOnly: true,
    description: "bot owner",
    requirements: {userIDs: [bot.owner]}
  });

  bot.registerCommand("untaguser", (msg, args) => tag(msg, args, false), {
    fullDescription: "untag a bitch",
    guildOnly: true,
    description: "bot owner",
    requirements: {userIDs: [bot.owner]}
  });
};