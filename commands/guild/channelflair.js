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
      title: "Rodger"
    }
  });

  let preFlair = "";
  let postFlair = "";

  let scrubFlair = function (flair) {
    let regexIllegalChars = /!|@|#|\$|%|\^|&|\*|\(|\)|\+|=|\/|\\|\||\{|\}|"|'|<|,|\.|>|\?|:|;|\[|\]|-{2,}/u;
    let scrubedFlair = flair;
    
    while(scrubedFlair.match(regexIllegalChars)){
      scrubedFlair = scrubedFlair.replace(regexIllegalChars, "-");
    }

    scrubedFlair = scrubedFlair.replace(/^-/gu, "");

    return scrubedFlair;
  }

  if (args[0]){

    preFlair = scrubFlair(args[0]);

    if (postFlair !== undefined){
      postFlair = scrubFlair(args[1]);
    }else{
      postFlair = "";
    }
  
    if (preFlair.length > 0){
      bot.edit (nmsg, {
        fields: [
          {
            name: "Adding flair:",
            value: `\`\`\`${preFlair} ${postFlair}\`\`\``,
            inline: false
          }
        ]
      });

      for (let i of msg.channel.guild.channels){
        let channel = i[1];
        let newname = preFlair + channel.name + postFlair;

        if (channel.type === 0){
          try{
            await channel.edit({name: newname}, "Channel flair");
          }catch(err){
            console.log(err);
          }
        }
      }
    }

  }else{

    msg.channel.guild.channels.forEach((channel)=>{
      if (channel.type === 0){

        // look for prefix flair
        preFlair = preFlair || channel.name;

        for (let i = 0; i < channel.name.length; i++) {
          if (channel.name.charAt(i) !== preFlair.charAt(i)){
            preFlair = preFlair.substring(0, i);
          }
        }

        // look for postfix flair
        let channelNameRev = channel.name.split("").reverse().join("");

        postFlair = postFlair || channelNameRev;

        for (let i = 0; i < channelNameRev.length; i++) {
          if (channelNameRev.charAt(i) !== postFlair.charAt(i)){
            postFlair = postFlair.substring(0, i);
          }
        }

        postFlair = postFlair.split("").reverse().join("");
      }
    });

    // Remove prefix flair
    if (preFlair.length > 0 || postFlair.length > 0){

      bot.edit (nmsg, {
        fields: [
          {
            name: "Removing flair",
            value: `\`\`\`${preFlair},${postFlair}\`\`\``,
            inline: false
          }
        ]
      });

      for (let i of msg.channel.guild.channels){
        let channel = i[1];
        let newname = channel.name;

        if (preFlair.length > 0){
          newname = newname.substring(preFlair.length);
        }

        if (postFlair.length > 0){
          newname = newname.substring(0, newname.length - postFlair.length);
        }

        if (channel.type === 0){
          try{
            await channel.edit({name: newname}, "Channel flair");
          }catch(err){
            console.log(err);
          }
        }
      }
    }
  }

  return bot.edit (nmsg, {
    fields: [
      {
        name: "Done",
        value: `\`\`\`${preFlair} ${postFlair}\`\`\``,
        inline: false
      }
    ]
  });
};
