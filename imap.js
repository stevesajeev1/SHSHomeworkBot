const notifier = require("mail-notifier");
const fs = require('fs');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat')
const config = require("./config.json");
const index = require("./index.js");
const helper = require("./helper/helper.js");
const add = require("./slash/add.js");
const edit = require("./slash/edit.js");

dayjs.extend(customParseFormat);

let botClient;
let debugging;

const imap = {
  username: config.imapEmail,
  password: config.imapPassword,
  host: "imap.gmail.com",
  port: 993, // imap port
  tls: true,
  connTimeout: 10000, // Default by node-imap
  authTimeout: 5000, // Default by node-imap,
  debug: null, // Or your custom function with only one incoming argument. Default: null
  tlsOptions: { rejectUnauthorized: false },
  mailbox: "INBOX", // mailbox to monitor
  searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved
  markSeen: true, // all fetched email will be marked as seen and not fetched next time
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
  mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib.
  attachments: false, // download attachments as they are encountered to the project directory
  attachmentOptions: { directory: "attachments/" }, // specify a download directory for attachments
}

function mail(mail) {
  // mail processing code goes here
  if (mail.from[0].address !== 'notifications@instructure.com') return;
  // parse role
  let channelID = parse(mail.from[0].name)[0];
  let roleID = parse(mail.from[0].name)[1];

  const subject = mail.subject;
  console.log(subject);
  const text = mail.text;
  if (debugging) {
    index.debug(text);
  }

  // Determine what type of action it is
  if (subject.startsWith("Updated Page: ")) return;

  if (subject.startsWith('Assignment Created - ')) {
    // add assignment
    let homeworkName = subject.substring(subject.indexOf("-") + 2, subject.lastIndexOf(",")).trim();
    let unparsedDate = text.substring(text.lastIndexOf("due") + 5, text.lastIndexOf("Click")).trim().replace(' at ', ' ').replace(/  +/g, ' ');
    if (debugging) {
      index.debug("Unparsed: " + unparsedDate);
    }
    let parsedDate = dayjs(unparsedDate, 'MMM D h:mma');
    if (!parsedDate.isValid()) {
        parsedDate = dayjs(unparsedDate, 'MMM D ha');
    }
    if (debugging) {
      index.debug("Parsed: " + parsedDate.format('MM/DD/YYYY h:mm A'));
    }
    // No due date
    if (!parsedDate.isValid()) {
      add.add(botClient, homeworkName, null, channelID);
    } else {
      add.add(botClient, homeworkName, parsedDate, channelID);
    }
  } else if (subject.startsWith('Assignment Due Date Changed: ')) {
    // edit assignment
    let homeworkName = subject.substring(subject.indexOf(":") + 2, subject.lastIndexOf(",")).trim();
    let unparsedDate = text.substring(text.lastIndexOf("to:") + 3, text.lastIndexOf("Click")).trim().replace(' at ', ' ').replace(/  +/g, ' ');
    if (debugging) {
      index.debug("Unparsed: " + unparsedDate);
    }
    let parsedDate = dayjs(unparsedDate, 'MMM D h:mma');
    if (!parsedDate.isValid()) {
        parsedDate = dayjs(unparsedDate, 'MMM D ha');
    }
    if (debugging) {
      index.debug("Parsed: " + parsedDate.format('MM/DD/YYYY h:mm A'));
    }
    // No due date
    if (!parsedDate.isValid()) {
      edit.edit(botClient, homeworkName, 'none', homeworkName, channelID);
    } else {
      edit.edit(botClient, homeworkName, parsedDate, homeworkName, channelID);
    }
  } else if (text.includes('/announcements/')) {
    // announce
    index.announce(`<@&${roleID}>\n**${subject.substring(0, subject.lastIndexOf(':'))}**\`\`\`\n${text.substring(0, text.lastIndexOf('________________________________________')).trim()}\n\`\`\``);
  } else {
    index.debug(subject);
  }
};

function parse(text) {
  let map = JSON.parse(fs.readFileSync('imapInfo.json')).classes;
  for (var key of map) {
    if (key.name == text) {
      return [key.id, helper.getRoleId(key.id)];
    }
  }
}

exports.start = (client, debug) => {
    botClient = client;
    debugging = debug;
    const n = notifier(imap);
    n.on('end', () => n.start()) // session closed
      .on('mail', m => {
        mail(m);
      })
      .on('error', () => n.start())
      .start();
    console.log('started imap listening');

    // stop listening
    // mailListener.stop();
}