module.exports = (bot) => {
  bot.registerCommand("bl", async (msg) => {
    let webhook = await msg.channel.getWebhooks();
    webhook = webhook.find((w) => w.id === bot.guildData.get(msg.channel.guild.id, [
      "webhooks",
      "botlog"
    ]).webhook);

    if (webhook) {
      bot.send(msg, "webhook exists");
    } else {
      webhook = await msg.channel.createWebhook({
        name: "botlog webhook"
      }, `requested by ${msg.author.username}#${msg.author.discriminator}`);
      bot.guildData.set(msg.channel.guild.id, [
        "webhooks",
        "botlog"
      ], {
        webhook: webhook.id,
        channel: msg.channel.id
      });
      bot.send(msg, "webhook created");
    }
  }, {
    fullDescription: "create a botlog webhook",
    guildOnly: true,
    description: "bot owner",
    requirements: {userIDs: [bot.owner]}
  });
};