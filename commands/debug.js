const fs = require('fs');
exports.run = (client, message, args) => {
    if (message.author.id !== client.config.ownerID) return;
    
    const json = fs.readdirSync("./").filter(file => file.endsWith(".json"));
    message.channel.send({ files: json });
};
  
exports.name = "debug";