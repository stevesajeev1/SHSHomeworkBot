const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const helper = require('../helper/helper.js');
const update = require('../helper/update.js');
const dayjs = require('dayjs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('delete homework')
        .setDefaultPermission(false),
	async run(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

        // check if mod
        if (!client.config.mods.includes(interaction.user.id)) {
            interaction.editReply(`<:error:946520648103108630> You are not a mod! DM ${client.users.cache.get(client.config.ownerID).toString()} if you want to apply!`);
            return;
        }
        
        // do stuff
        
        // generate list of homeworks in system
        // first generate the options
        let options = [];
        let homework = JSON.parse(fs.readFileSync('homework.json'));
        // check if there is any homework in the first place
        if (homework.length == 0) {
            interaction.editReply({ content: `As there is no homework at this time, there is nothing to edit!`});
            return;
        }
        for (var work of homework) {
            options.push({
                label: `${work.name} | ${helper.getClassName(work.channelID)}`,
                value: `|${work.name}| |${helper.getClassName(work.channelID)}|`
            });
        }

        const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('deleteHomework')
					.setPlaceholder('Select the Homework')
					.addOptions(options)
                    .setMaxValues(1)
			);
        
        interaction.editReply({ components: [row]});
	},
    
    async selectionMenu(client, interaction) {
        const oldName = helper.extract(interaction.values[0], '|')[0];
        const oldClass = helper.getChannelId(helper.extract(interaction.values[0], '|')[1]);
        
        deleteWork(client, oldName, oldClass);

        interaction.update({ content: `:white_check_mark: Deleted the homework.`, components: [] });
    },
    deleteWork: deleteWork
};


function deleteWork(client, oldName, oldChannelID) {
    let homework = JSON.parse(fs.readFileSync('homework.json'));
    homework.sort(function(a, b) {
        if (a.channelID == b.channelID) {
            let diff = dayjs(a.dueDate).diff(b.dueDate, 'day');
            return diff == 0 ? a.name.localeCompare(b.name) : diff;
        } else {
            return a.channelID.localeCompare(b.channelID);
        }
    });
    for (var i = 0; i < homework.length; i++) {
        if (homework[i].name == oldName && homework[i].channelID == oldChannelID) {
            homework.splice(i, 1);
            break;
        }
    }
    fs.writeFileSync('homework.json', JSON.stringify(homework, null, 2));
    update.update(client);
}