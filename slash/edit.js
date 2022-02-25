const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const helper = require('../helper/helper.js');
const update = require('../helper/update.js');
const dayjs = require('dayjs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edit')
		.setDescription('edit homework')
        .addStringOption(option => 
            option.setName('edit-name')
                .setDescription('edit homework name'))
        .addStringOption(option => 
            option.setName('edit-date')
                .setDescription('edit due date of homework'))
        .setDefaultPermission(false),
	async run(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

        let header = "";
        if (interaction.options.getString('edit-name')) {
            header += `Change name to : \`${interaction.options.getString('edit-name')}\`\n`;
        }
        if (interaction.options.getString('edit-date')) {
            if (!helper.validDate(interaction.options.getString('edit-date'))) {
                interaction.editReply(`<:error:946520648103108630> \`${interaction.options.getString('edit-date')}\` is not a valid date. **Ensure** dates are after now and are in a regular format.`);
                return;
            }
            let date = helper.validDate(interaction.options.getString('edit-date'));
            header += `Change date to : \`${date.format('MM/DD/YYYY h:mm A')}\``;
        }
        if (header == "") {
            interaction.editReply("Since you did not supply any changes, no edits are being made.");
            return;
        }

        // generate list of homeworks in system
        // first generate the options
        let options = [];
        let homework = JSON.parse(fs.readFileSync('homework.json'));
        for (var work of homework) {
            options.push({
                label: `${work.name} - ${helper.getClassName(work.channelID)}`,
                value: `|${work.name}| |${helper.getClassName(work.channelID)}|`
            });
        }

        const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('editHomework')
					.setPlaceholder('Select the Homework')
					.addOptions(options)
                    .setMaxValues(1)
			);
        
        interaction.editReply({ content: header, components: [row]});
	},
    async successfulEdit(client, interaction) {
        const initialContent = interaction.message.content;
        let newName = "";
        let newDate = "";
        let position = 0;
        if (initialContent.includes('Change name to')) {
            newName = helper.extract(initialContent, '`')[position];
            position++;
        }
        if (initialContent.includes('Change date to')) {
            newDate = helper.extract(initialContent, '`')[position];
        }
        const oldName = helper.extract(interaction.values[0], '|')[0];
        const oldClass = helper.getChannelId(helper.extract(interaction.values[0], '|')[1]);
        
        edit(client, newName, newDate, oldName, oldClass);

        interaction.update({ content: `:white_check_mark: Edited the homework.`, components: [] });
    }
};


function edit(client, newName, newDate, oldName, oldChannelID) {
    let homework = JSON.parse(fs.readFileSync('homework.json'));
    for (var i = 0; i < homework.length; i++) {
        if (homework[i].name == oldName && homework[i].channelID == oldChannelID) {
            if (newName) {
                homework[i].name = newName;
            } 
            if (newDate) {
                let date = dayjs(newDate);
                let difference = helper.difference(date);
                difference = difference >= 2 ? difference = 2 : difference;
                homework[i].dueDate = date;
                homework[i].timesPinged = Math.max(0, 1 - difference);
            }
            break;
        }
    }
    fs.writeFileSync('homework.json', JSON.stringify(homework, null, 2));
    update.update(client)
}

exports.edit = edit;