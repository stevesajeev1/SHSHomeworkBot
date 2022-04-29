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
        .addStringOption(option => 
             option.setName('title')
                .setDescription('title of announcement')
                .setRequired(false))
        .setDefaultPermission(false),
	async run(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

        // check if mod
        if (!client.config.mods.includes(interaction.user.id)) {
            interaction.editReply(`<:error:946520648103108630> You are not a mod! DM ${client.users.cache.get(client.config.ownerID)} if you want to apply!`);
            return;
        }
        
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
        let title = interaction.options.getString('title') ? `**Title**: \`\`\`\n${interaction.options.getString('title')}\n\`\`\`` : '';
        interaction.editReply({ content: `${title}**Text**: \`\`\`\n${interaction.options.getString('text')}\n\`\`\``, components: [row]});
	},
    async selectionMenu(client, interaction) {
        const initialContent = interaction.message.content;
        const title = helper.extract(initialContent, "`").filter(group => group.length > 0)[0];
        const text = helper.extract(initialContent, "`").filter(group => group.length > 0)[1];
        const roleID = interaction.values[0];
        
        index.announce(`<@&${roleID}>**${title}**\`\`\`\n${text}\n\`\`\``);

        interaction.update({ content: `:white_check_mark: Successfully made the announcement. `, components: [] });
    }
};