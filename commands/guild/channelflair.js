exports.info = {
  args: "[flair]",
  description: "adds a flair to all channels"
};

exports.run = async function (bot, msg, args) {
  if (!bot.checkPerm(msg, "manageChannels")){
    bot.commandDeny(msg, "MISSING_PERM");
    return;
  }



  let nmsg = await bot.createMessage(msg.channel.id, {embed:
    {
      color: bot.color,
      title: "Editing channels"
    }
  });

  let failedChannels = [];
  for (let i of msg.channel.guild.channels){
    let channel = i[1];

    console.log(channel.permissionsOf(bot.user.id))

    if (channel.type === 0){
      try{
        await channel.edit({name: `${channel.name}`});
      }catch(err){
        failedChannels.push(channel);
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
