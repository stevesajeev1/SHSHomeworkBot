const { Client, Intents, MessageEmbed } = require("discord.js");
const config = require("./config.json");
const prompt = require('prompt-sync')({sigint: true});
const fs = require('fs');
const stringSimilarity = require('string-similarity');

const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_MESSAGE_TYPING,
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
      Intents.FLAGS.DIRECT_MESSAGE_TYPING,
      Intents.FLAGS.GUILD_MEMBERS
    ],
    partials: [
        'CHANNEL', // Required to receive DMs
        'REACTION'
    ]
});
client.login(config.token);

let channels = JSON.parse(fs.readFileSync('channels.json'));
let imapInfo = JSON.parse(fs.readFileSync('imapInfo.json'));

client.on("ready", async () => {
    console.log("Setting up class information...");

    let schoolYear;
    while (!schoolYear) {
        schoolYear = prompt("What is the school year?");
    }
    console.log(`School Year: ${schoolYear}`);

    const classCategory = client.channels.cache.get(config.classCategory);
    const roles = client.guilds.cache.get(config.guildID).roles.cache;
    const roleNames = roles.map(role => role.name);
    let reactions = [];
    let description = '';
    for (classChannel of classCategory.children) {
        if (classChannel[1].id != config.classPicker) {
            console.log();
            const name = classChannel[1].name;
            reactions.push(name.substring(0, name.indexOf("-")));
            console.log(`Setup for ${name}`);
            console.log();
            let properName;
            while (!properName) {
                properName = prompt("Enter proper name: ");
            }
            console.log(`Proper Name: ${name.substring(0, name.indexOf("-"))} ${properName}`);
            console.log(`Channel ID: ${classChannel[1].id}`);
            console.log();
            console.log("Trying to automatically search for matching role...");
            let autoRoleName = stringSimilarity.findBestMatch(properName, roleNames).bestMatch.target;
            let autoRole = roles.find(role => role.name == autoRoleName);
            console.log(`Role automatically selected: ${autoRoleName}, id: ${autoRole}`);
            const correct = prompt("Is this correct? (type anything for no): ");
            if (correct) {
                let role;
                while (!role) {
                    role = prompt("Enter role ID: ");
                }
                autoRole = roles.find(r => r.id == role);
                console.log(`Role selected: ${autoRole.name}, id: ${autoRole}`);
            }
            description += `${name.substring(0, name.indexOf("-"))} ${autoRole}\n`;
            console.log();
            let imapName = prompt("Enter eCampus name (if unknown press enter): ");
            if (!imapName) {
                imapName = properName.toLowerCase();
            }
            console.log(`IMAP Name: ${imapName}`);
            console.log();
            classChannelObject = {
                name: `${name.substring(0, name.indexOf("-"))} ${properName}`,
                channelID: classChannel[1].id,
                roleID: autoRole.id
            }
            imapObject = {
                name: imapName,
                id: classChannel[1].id
            }
            console.log("Class channel entry: ");
            console.log(classChannelObject);
            console.log("IMAP entry: ")
            console.log(imapObject);
            channels.push(classChannelObject);
            imapInfo.push(imapObject);
        }
    }
    fs.writeFileSync('channels.json', JSON.stringify(channels, null, 2));
    fs.writeFileSync('imapInfo.json', JSON.stringify(imapInfo, null, 2));

    let embed = new MessageEmbed()
        .setTitle(`${schoolYear} Classes`)
        .setColor('#9B59B6')
        .setDescription(description);
    
    client.channels.cache.get(config.classPicker).send({ embeds: [embed] })
        .then(m => {
            for (var reaction of reactions) {
                await m.react(reaction);
            }
        })
});