exports.info = {
  args: "[flair]",
  description: "adds a flair to all channels"
};

exports.run = async function(bot, msg, args) {
  let nmsg = await bot.createMessage(msg.channel.id, {embed:
    {
      color: bot.color,
      title: "Editing channels"
    }
  });

  let failedChannels = []
  for(let channel of msg.channel.guild.channels){
    if(channel[1].type == 0){
      try{
        await channel[1].edit({name: channel[1].name});
      }catch(err){
        failedChannels.push(channel[1])
      }
    }
  }

  let channelsFailedString = ""
  for (let channel of failedChannels){
    channelsFailedString = channelsFailedString + "\n" + channel.name
  }

  return bot.editMessage(nmsg.channel.id, nmsg.id, {embed:
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