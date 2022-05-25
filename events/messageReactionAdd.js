module.exports = async (client, reaction, user) => {
    if(reaction.message.partial) await reaction.message.fetch();
    if(reaction.partial) await reaction.fetch();

    if (reaction.message.author == client.user) {
        if (reaction.message.embeds[0]?.title == "Mass Mention") {
            let reactionAmount = reaction.message.reactions.cache.get('✅').count;
            let footer = reaction.message.embeds[0].footer;
            if (reactionAmount >= 5 && footer) {
                let embed = reaction.message.embeds[0];
                delete embed.footer;
                embed.setDescription("Ping has been found to be unjustified! A 10 minute mute has been enacted.");
                reaction.message.edit({ embeds: [embed] });
                const mutedRole = reaction.message.guild.roles.cache.get(client.config.mutedRole);
                const target = reaction.message.guild.members.cache.get(client.config.amritID);
                target.roles.add(mutedRole);
                setTimeout(() => {
                    target.roles.remove(mutedRole); // remove the role
                  }, 10 * 60 * 1000) 
            }
        } else if (reaction.message.embeds[0]?.title.includes("Classes")) {
            if (user.bot) {
                return;
            }
            let channels = JSON.parse(fs.readFileSync('channels.json'));
            for (var channel of channels) {
                if (channel.name.startsWith(reaction.emoji.name)) {
                    const role = reaction.message.guild.roles.cache.get(channel.roleID);
                    user.roles.add(role);
                }
            }
        }
    }
}