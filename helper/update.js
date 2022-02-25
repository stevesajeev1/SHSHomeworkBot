const homework = require('./homework.js');
const helper = require('./helper.js');
const fs = require('fs');
const index = require('../index.js');

async function update(client) {
    let channels = JSON.parse(fs.readFileSync('channels.json'));
    for (var channel of channels) {
        const pinnedMessage = await client.channels.cache.get(channel.channelID).messages.fetch(channel.pinnedID);
        pinnedMessage.edit({ embeds: [homework.generateHomework(channel.channelID, channel.roleID)] });
    }
}

exports.update = update;

function remind(homework, dueNow) {
    let difference = helper.difference(homework.dueDate);
    if (homework.timesPinged < 2 - difference) {
        if (difference == 0) {
            difference = "today";
        } else if (difference == 1) {
            difference = "tomorrow";
        }
        index.announce(`<@&${helper.getRoleId(homework.channelID)}> \`${homework.name}\` is due **${difference}!**`);
    } else if (dueNow) {
        index.announce(`<@&${helper.getRoleId(homework.channelID)}> \`${homework.name}\` is due **now!**`);
        // delete the homework now
    } else {
        return;
    }
    let homeworkFile = JSON.parse(fs.readFileSync('homework.json'));
    for (var i = 0; i < homeworkFile.length; i++) {
        if (homeworkFile[i].name == homework.name) {
            homeworkFile[i].timesPinged++;
            break;
        }
    }
    fs.writeFileSync('homework.json', JSON.stringify(homeworkFile, null, 2));
}

exports.remind = remind;