exports.info = {
  args: "none",
  description: "does nothing"
};

exports.run = async function (bot, msg, args) {
  bot.createMessage(msg.channel.id, "aaaaAAAAAAAAAAA " + args.join(" "));
  return;
};