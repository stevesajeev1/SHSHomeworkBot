const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const helper = require('../helper/helper.js');
const index = require('../index.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('announce')
		.setDescription('school announcement')
        .addStringOption(option => 
            option.setName('text')
                .setDescription('text to announce')
                .setRequired(true))
        .setDefaultPermission(false),
	async run(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

        // do stuff
        
        // generate list of homeworks in system
        // first generate the options
        let options = [];
        let classes = JSON.parse(fs.readFileSync('channels.json'));
        for (var className of classes) {
            options.push({
                label: className.name,
                value: className.roleID
            });
        }

        const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('announce')
					.setPlaceholder('Select a Class')
					.addOptions(options)
                    .setMaxValues(1)
			);
        interaction.editReply({ content: `**Text**: \`\`\`\n${interaction.options.getString('text')}\n\`\`\``, components: [row]});
	},
    async successfulAnnouncement(client, interaction) {
        const initialContent = interaction.message.content;
        const text = helper.extract(initialContent, "`").filter(group => group.length > 0)[0];
        const roleID = interaction.values[0];
        
        index.announce(`<@&${roleID}> \n\`\`\`\n${text}\n\`\`\``);

        interaction.update({ content: `:white_check_mark: Successfully made the announcement. `, components: [] });
    }
};