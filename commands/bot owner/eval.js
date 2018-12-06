/**
* Evaluates code remotely (Owner only).
* @param {string} i The code to eval
* @return {string} The output of the eval function.
*/

const util = require("util");

exports.info = {
  args: "[code]",
  description: "runs ur code"
};

exports.run = function (bot, msg, args) {
  let input = " " + args.join(" ");
  let evaled;

  try {
    evaled = eval(input);
  } catch (err) {
    evaled = err;
  }
  
  evaled = util.inspect(evaled);
  
  evaled.replace(/`/g, "`" + String.fromCharCode(8203));

  for (let i in bot.secret){
    evaled = evaled.replace(bot.secret[i], "👀");
  }

  if (evaled.length > 1024){
    evaled = evaled.substring(0, evaled.length-(evaled.length-1012)) + "...";
  }

  return bot.createMessage(msg.channel.id, {embed:
    {
      color: bot.color,
      fields: [
        {
          name: "Input:",
          value: `\`\`\`js\n${input}\`\`\``,
          inline: false
        },
        {
          name: "Output:",
          value: `\`\`\`js\n${evaled}\`\`\``,
          inline: false
        }
      ]
    }
  });
};