const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const dayjs = require('dayjs');
const helper = require('./helper.js');
const update = require('./update.js');

exports.generateHomework = (client, channelID, roleID) => {
    let homework = JSON.parse(fs.readFileSync('homework.json'));
    homework.sort(function(a, b) {
        if (a.channelID == b.channelID) {
            let diff = dayjs(a.dueDate).diff(b.dueDate, 'day');
            return diff == 0 ? a.name.localeCompare(b.name) : diff;
        } else {
            return a.channelID.localeCompare(b.channelID);
        }
    });
    fs.writeFileSync('homework.json', JSON.stringify(homework, null, 2));
    let homeworkEmbed = new MessageEmbed()
        .setColor('#9B59B6')
    let homeworkList = `<@&${roleID}>\n\`\`\`diff\n`;
    var ran = false;
    for (var work of homework) {
        if (work.channelID == channelID) {
            ran = true;
            if (work.dueDate == null) {
                homeworkList += `- ${work.name} | No due date\n`
            } else {
                let difference = helper.difference(work.dueDate);
                if (difference == 0) {
                    difference = "Today";
                    update.remind(client, work, false, false);
                } else if (difference == 1) {
                    difference = "Tomorrow";
                    update.remind(client, work, false, false);
                } else if (difference < 0) {
                    update.remind(client, work, false, true);
                    continue;
                } else {
                    difference += " days";
                }
                homeworkList += `- ${work.name} | ${dayjs(work.dueDate).format('MM/DD/YYYY h:mm A')} | ${difference}\n`
            }
        }
    }
    if (!ran) {
        homeworkList += "Hooray, no homework at this time! 🎉";
    }
    homeworkList += "\n```";
    homeworkEmbed.setDescription(homeworkList);
    return homeworkEmbed;
}