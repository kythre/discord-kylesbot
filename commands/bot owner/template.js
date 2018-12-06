exports.info = {
  args: "none",
  description: "does nothing"
};

exports.run = async function (bot, msg, args) {
  return bot.createMessage(msg.channel.id, "aaaaAAAAAAAAAAA");
};