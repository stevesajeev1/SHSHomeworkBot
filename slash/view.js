const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const homework = require('../helper/homework.js');
const config = require('../config.json');

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
            let guild = client.guilds.cache.get(config.guildID);
            let member = guild.members.cache.get(interaction.user.id);
            if (member && member.roles.cache.has(className.roleID)) {
                let hw = homework.generateHomework(client, className.channelID, className.roleID).description + "\n";
                if (!hw.includes("Hooray, no homework at this time! 🎉")) {
                    homeworkDescription += hw;
                }
            }
        }
        if (homeworkDescription == "") {
            interaction.editReply("Hooray, no homework at this time! 🎉");
        } else {
            homeworkEmbed.setDescription(homeworkDescription);
            interaction.editReply({ embeds: [homeworkEmbed]});
        }
	}
};