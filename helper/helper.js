const dayjs = require('dayjs');
const fs = require('fs');

exports.validDate = (input) => {
    let inputDate = dayjs(input);
    if (!inputDate.isValid()) {
        return false;
    }
    if (inputDate.hour() == 0 && inputDate.minute() == 0) {
        inputDate = inputDate.endOf('day');
    }
    return inputDate.isAfter(dayjs()) ? inputDate : false;
}

exports.extract = (text, separator) => {
    let data = [];
    let timesSeen = 0;
    let startPos = 0;
    for (var i = 0; i < text.length; i++) {
        if (text[i] === separator) {
            if (timesSeen % 2 == 0) {
                startPos = i + 1;
            } else {
                data.push(text.substring(startPos, i));
            }
            timesSeen++;
        }
    }
    return data;
}

exports.getClassName = (channelID) => {
    let classes = JSON.parse(fs.readFileSync('channels.json'));
    for (var className of classes) {
        if (className.channelID === channelID) {
            return className.name;
        }
    }
}

exports.difference = (date) => {
    return -1 * dayjs().startOf('day').diff(dayjs(date).startOf('day'), 'day');
}

exports.getRoleId = (channelID) => {
    let channels = JSON.parse(fs.readFileSync('channels.json'));
    for (var channel of channels) {
        if (channel.channelID === channelID) {
            return channel.roleID;
        }
    }
}

exports.getChannelId = (className) => {
    let classes = JSON.parse(fs.readFileSync('channels.json'));
    for (var channel of classes) {
        if (channel.name === className) {
            return channel.channelID;
        }
    }
}