const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const homework = require('../helper/homework.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('view')
		.setDescription('view homework')
        .setDefaultPermission(true),
	async run(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

        // do stuff
        
        // send homework embed
        let homeworkEmbed = new MessageEmbed()
            .setColor('#9B59B6')
        let classes = JSON.parse(fs.readFileSync('channels.json'));
        let homeworkDescription = "";
        for (var className of classes) {
            if (interaction.member.roles.cache.has(className.roleID)) {
                homeworkDescription += homework.generateHomework(client, className.channelID, className.roleID).description + "\n";
            }
        }
        homeworkEmbed.setDescription(homeworkDescription);
        interaction.editReply({ embeds: [homeworkEmbed]});
	}
};