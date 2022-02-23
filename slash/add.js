const { SlashCommandBuilder } = require('@discordjs/builders');

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
		await interaction.deferReply(true);

        // do stuff
	},
};