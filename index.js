const { Client, Intents, Collection } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
const config = require("./config.json");

const imap = require("./imap.js");
const update = require('./helper/update.js')

const schedule = require('node-schedule');
const dayjs = require('dayjs');

// We also need to make sure we're attaching the config to the CLIENT so it's accessible everywhere!
client.config = config;
client.commands = new Collection();
client.slashcmds = new Collection();

const events = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
for (const file of events) {
  const eventName = file.split(".")[0];
  const event = require(`./events/${file}`);
  client.on(eventName, event.bind(null, client));
}

const commands = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commands) {
  const commandName = file.split(".")[0];
  const command = require(`./commands/${file}`);

  console.log(`Attempting to load command ${commandName}`);
  client.commands.set(commandName, command);
}

const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"));
for (const file of slashFiles) {
  const commandName = file.split(".")[0];
  const command = require(`./slash/${file}`);
  
  console.log(`Attempting to load slash command ${commandName}`);
  client.slashcmds.set(commandName, command);
}

client.login(config.token);
imap.start();

// listen for scheduling
console.log('started running every minute');
schedule.scheduleJob("0 * * ? * *", function() {
    // Updates pinned messages at start of day
    let now = dayjs();
    if (now.hour() == 0 && now.minute() == 0) {
        update.update();
    }
    
    // Check if time matches any homework
    let homework = JSON.parse(fs.readFileSync('homework.json'));
    for (var work of homework) {
        if (now.isSame(dayjs(work.dueDate), 'minute')) {
            remind(work, true);
        }
    }
})

exports.announce = (text) => {
  client.channels.cache.get(config.announcement).send(text);
}