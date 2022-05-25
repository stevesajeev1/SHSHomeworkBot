module.exports = async (client, reaction, user) => {
    if(reaction.message.partial) await reaction.message.fetch();
    if(reaction.partial) await reaction.fetch();

    if (reaction.message.author == client.user) {
        if (reaction.message.embeds[0]?.title.includes("Classes")) {
            if (user.bot) {
                return;
            }
            let channels = JSON.parse(fs.readFileSync('channels.json'));
            for (var channel of channels) {
                if (channel.name.startsWith(reaction.emoji.name)) {
                    const role = reaction.message.guild.roles.cache.get(channel.roleID);
                    user.roles.remove(role);
                }
            }
        }
    }
}