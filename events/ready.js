const homework = require('../helper/homework.js');
const update = require('../helper/update.js');
const fs = require('fs');

module.exports = async (client) => {
    // Basic activity setup
    client.user.setActivity('for new assignments! |', { type: 'WATCHING' });
    client.user.setStatus('online');
    console.log(`Ready to serve in ${client.channels.cache.size} channels on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users.`);

    // Setup slash commands
    let permissions = [];
    for (var mod of client.config.mods) {
        permissions.push({
            id: mod,
            type: 'USER',
            permission: true
        })
    }
    const guild = await client.guilds.fetch(client.config.guildID);
    const commandList = await guild.commands.fetch();
    commandList.forEach(slashCommand => {
        guild.commands.permissions.add({
            command: slashCommand.id,
            permissions: permissions
        })
    })
    console.log("Setup perms for application (/) commands");

    // Check pinned
    await checkPinned(client);

    // Update
    update.update(client);
}

async function checkPinned(client) {
    let channels = JSON.parse(fs.readFileSync('channels.json'));
    for (var channel of channels) {
        if (!channel.hasOwnProperty('pinnedID')) {
            let pinned = await client.channels.cache.get(channel.channelID).send({
                embeds: [homework.generateHomework(channel.channelID, channel.roleID)]
            });
            pinned.pin();
            channel.pinnedID = pinned.id;
        }
    }
    fs.writeFileSync('channels.json', JSON.stringify(channels, null, 2));
}