const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const helper = require('../helper/helper.js');
const update = require('../helper/update.js');
const fs = require('fs');
const dayjs = require('dayjs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('add homework to the bot')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('homework name')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('date')
                .setDescription('due date of homework')
                .setRequired(true))
        .setDefaultPermission(false),
	async run(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

        // do stuff
        let name = interaction.options.getString('name');
        let date = interaction.options.getString('date');

        if (!helper.validDate(date)) {
            interaction.editReply(`<:error:946520648103108630> \`${date}\` is not a valid date. **Ensure** dates are after now and are in a regular format.`);
            return;
        }
        date = helper.validDate(date);

        // create selection menu for classes
        // first generate the options
        let options = [];
        let classes = JSON.parse(fs.readFileSync('channels.json'));
        for (var className of classes) {
            options.push({
                label: className.name,
                value: className.channelID
            });
        }

        const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('addClass')
					.setPlaceholder('Select a Class')
					.addOptions(options)
                    .setMaxValues(1)
			);
        interaction.editReply({ content: `**Name**: \`${name}\` **Date**: \`${date.format('MM/DD/YYYY h:mm A')}\``, components: [row]});
	},
    async successfulAddition(client, interaction) {
        const initialContent = interaction.message.content;
        const homeworkName = helper.extract(initialContent, '`')[0];
        const date = dayjs(helper.extract(initialContent, '`')[1]);
        interaction.update({ content: `:white_check_mark: Added \`${homeworkName}\` due \`${date.format('MM/DD/YYYY h:mm A')}\` for \`${helper.getClassName(interaction.values[0])}\``, components: [] });
        add(client, homeworkName, date, interaction.values[0]);
    }
};

function add(client, homeworkName, date, channelID) {
    let homework = JSON.parse(fs.readFileSync('homework.json'));
    let difference = helper.difference(date);
    difference = difference >= 2 ? difference = 2 : difference;
    homework.push({
        name: homeworkName,
        dueDate: date,
        channelID: channelID,
        timesPinged: Math.max(0, 1 - difference)
    })
    fs.writeFileSync('homework.json', JSON.stringify(homework, null, 2));
    update.update(client);
}

exports.add = add;