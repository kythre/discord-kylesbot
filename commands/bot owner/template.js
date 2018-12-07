exports.info = {
  args: "none",
  description: "does nothing"
};

exports.run = async function (bot, msg, args) {
  bot.send(msg, "aaaaAAAAAAAAAAA " + args.join(" "));
  return;
};