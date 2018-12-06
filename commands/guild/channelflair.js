exports.info = {
  args: "[flair]",
  description: "adds a flair to all channels"
};

exports.run = async function (bot, msg, args) {
  let nmsg = await bot.createMessage(msg.channel.id, {embed:
    {
      color: bot.color,
      title: "Editing channels"
    }
  });

  let failedChannels = [];
  for (let channel of msg.channel.guild.channels){
    let channelObj = channel[1]
    if (channelObj.type === 0){
      try{
        await channelObj.edit({name: channelObj.name});
      }catch(err){
        failedChannels.push(channelObj);
      }
    }
  }

  let channelsFailedString = "";
  for (let channel of failedChannels){
    channelsFailedString = channelsFailedString + "\n" + channel.name;
  }

  return bot.editMessage (nmsg.channel.id, nmsg.id, {embed:
    {
      color: bot.color,
      fields: [
        {
          name: "Couldnt edit:",
          value: `\`\`\`js${channelsFailedString}\`\`\``,
          inline: false
        }
      ]
    }
  });
};