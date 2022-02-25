const { SlashCommandBuilder } = require('@discordjs/builders');
const index = require('../index.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('announce')
		.setDescription('school announcement')
        .addStringOption(option => 
            option.setName('text')
                .setDescription('text to announce'))
        .setDefaultPermission(false),
	async run(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

        index.announce(interaction.options.getString('text'));
        
        interaction.editReply({ content: `:white_check_mark: Announced the homework.`});
	},
};