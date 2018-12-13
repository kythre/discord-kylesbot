/**
* Saves data (Owner only).
*/
exports.info = {
  usage: "save",
  args: "none",
  description: "saves data to file"
};

exports.run = async function (bot, msg) {
  await bot.save();
  bot.send(msg, "done");
};