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
                .setRequired(false))
        .setDefaultPermission(false),
	async run(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

        // check if mod
        if (!client.config.mods.includes(interaction.user.id)) {
            interaction.editReply(`<:error:946520648103108630> You are not a mod! DM ${client.users.cache.get(client.config.ownerID).toString()} if you want to apply!`);
            return;
        }

        // do stuff
        let name = interaction.options.getString('name');
        let date;
        if (interaction.options.getString('date')) {
            date = interaction.options.getString('date');

            if (!helper.validDate(date)) {
                interaction.editReply(`<:error:946520648103108630> \`${date}\` is not a valid date. **Ensure** dates are after now and are in a regular format.`);
                return;
            }
            date = helper.validDate(date);
        }

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
        interaction.editReply({ content: `**Name**: \`${name}\` **Date**: \`${date ? date.format('MM/DD/YYYY h:mm A') : 'No due date'}\``, components: [row]});
	},
    async selectionMenu(client, interaction) {
        const initialContent = interaction.message.content;
        const homeworkName = helper.extract(initialContent, '`')[0];
        const date = dayjs(helper.extract(initialContent, '`')[1]);
        interaction.update({ content: `:white_check_mark: Added \`${homeworkName}\` due \`${date.isValid() ? date.format('MM/DD/YYYY h:mm A') : 'N/A'}\` for \`${helper.getClassName(interaction.values[0])}\``, components: [] });
        add(client, homeworkName, date.isValid() ? date : null, interaction.values[0]);
    },
    add: add
};

function add(client, homeworkName, date, channelID) {
    let homework = JSON.parse(fs.readFileSync('homework.json'));
    homework.sort(function(a, b) {
        if (a.channelID == b.channelID) {
            let diff = dayjs(a.dueDate).diff(b.dueDate, 'day');
            return diff == 0 ? a.name.localeCompare(b.name) : diff;
        } else {
            return a.channelID.localeCompare(b.channelID);
        }
    });
    if (date == null) {
        homework.push({
            name: homeworkName,
            dueDate: date,
            channelID: channelID,
            timesPinged: 0
        })
    } else {
        let difference = helper.difference(date);
        difference = difference >= 2 ? difference = 2 : difference;
        homework.push({
            name: homeworkName,
            dueDate: date,
            channelID: channelID,
            timesPinged: Math.max(0, 1 - difference)
        })
    }
    fs.writeFileSync('homework.json', JSON.stringify(homework, null, 2));
    update.update(client);
}