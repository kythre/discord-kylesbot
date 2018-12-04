/**
* Audits commands (Owner only).
*/
exports.info = {
  usage: "audit",
  args: "none",
  description: "audits all command files"
};

exports.run = async function(self, msg) {
  self.commands = {};
  self.commandsOrganized = {};
  await self.audit();
  msg.channel.createMessage("done");
};