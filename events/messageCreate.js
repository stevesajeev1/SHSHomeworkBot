const { MessageEmbed } = require('discord.js')

module.exports = (client, message) => {
    // Ignore all bots
    if (message.author.bot) return;
  
    if (message.author.id == client.config.amritID) {
        let membersMentioned = 0;
        membersMentioned += message.mentions.members.size;
        for (var role of message.mentions.roles) {
            membersMentioned += role[1].members.size;
        }
        if (membersMentioned >= 9) {
            let embed = new MessageEmbed()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setTitle("Mass Mention")
                .setDescription("Mass mention detected! Vote if this ping is justified.")
                .setFooter({ text: ">=5 votes needed in order to enact a mute" })
                .setColor('#9B59B6');
            message.reply({ embeds: [embed] })
                .then(m => m.react("✅"))
        }      
    }

    // Ignore messages not starting with the prefix (in config.json)
    if (message.content.indexOf(client.config.prefix) !== 0) return;
  
    // Our standard argument/command name definition.
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
  
    // Grab the command data from the client.commands Enmap
    const cmd = client.commands.get(command);
  
    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return;
  
    // Run the command
    cmd.run(client, message, args);
};