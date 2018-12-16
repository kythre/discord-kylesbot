module.exports = (bot) => {
  bot.edit = function (msg, content) {
    bot.editMessage(msg.channel.id, msg.id, bot.embed(msg, content));
  };

  bot.embed = function (msg, content) {
    let embed;

    if (typeof content === "string") {
      embed = {
        description: content
      };
    } else {
      embed = content;
    }

    // embed.footer = `${msg.author.username}#${msg.author.discriminator}`
    embed.footer = embed.footer || msg.embeds[0] ? msg.embeds[0].footer : "";
    embed.footer = embed.footer || {text: msg.cmd ? msg.cmd.name : msg.content.split(" ")[0]};
    embed.timestamp = embed.timestamp || new Date(msg.timestamp).toISOString();
    embed.color = embed.color || bot.color;

    return {
      embed
    };
  };

  bot.send = function (msg, content) {
    let nmsg = bot.createMessage(msg.channel.id, bot.embed(msg, content));
    nmsg.cmd = msg.cmd;
    return nmsg;
  };
};