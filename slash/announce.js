const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu, Modal, TextInputComponent } = require('discord.js');
const fs = require('fs');
const helper = require('../helper/helper.js');
const index = require('../index.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('announce')
		.setDescription('school announcement')
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
        let options = [{
            label: "📣 General",
            value: `<@&${client.config.everyoneRole}>`
        }];
        let classes = JSON.parse(fs.readFileSync('channels.json'));
        for (var className of classes) {
            options.push({
                label: className.name,
                value: `<@&${className.roleID}>`
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
        interaction.editReply({ components: [row] });
	},
    async selectionMenu(client, interaction) {
        const modal = new Modal()
            .setTitle('Announcement')
            .setCustomId(interaction.values[0])

        const titleInput = new TextInputComponent()
            .setCustomId('titleInput')
            .setLabel("Title:")
            .setStyle('SHORT')
            .setRequired(false)
        const textInput = new TextInputComponent()
            .setCustomId('textInput')
            .setLabel("Text:")
            .setStyle('PARAGRAPH')
            .setRequired(true)
        
        const titleActionRow = new MessageActionRow().addComponents(titleInput);
        const textActionRow = new MessageActionRow().addComponents(textInput);

        modal.addComponents(titleActionRow, textActionRow);

        await interaction.showModal(modal);
    },
    async modal(client, interaction) {
        const title = interaction.fields.getTextInputValue('titleInput');
        const text = interaction.fields.getTextInputValue('textInput');
        const roleID = interaction.customId;

        if (title) {
            index.announce(`${roleID} **${title}**\`\`\`\n${text}\n\`\`\``);
        } else {
            index.announce(`${roleID} \`\`\`\n${text}\n\`\`\``);
        }
        
        interaction.update({ content: `:white_check_mark: Successfully made the announcement. `, components: [] });
    }
};