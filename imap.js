var MailListener = require("mail-listener-fixed2");
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

var mailListener = new MailListener({
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
  keepalive: {
    interval : 10000,
    idleInterval: 60000,
    forceNoop: true
  }
});

mailListener.on("server:connected", function(){
  console.log("imapConnected");
});

mailListener.on("server:disconnected", function(){
  console.log("imapDisconnected");
});

mailListener.on("error", function(err){
  console.log(err);
  mailListener = new MailListener({
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
    keepalive: {
      interval : 10000,
      idleInterval: 60000,
      forceNoop: true
    }
  });
  mailListener.start(); // start listening
  console.log('reconnected');
});

mailListener.on("mail", function(mail, seqno, attributes){
  // mail processing code goes here
  if (mail.headers.get('from').value[0].address !== 'notifications@instructure.com') return;
  // parse role
  let channelID = parse(mail.headers.get('from').value[0].name)[0];
  let roleID = parse(mail.headers.get('from').value[0].name)[1];

  const subject = mail.headers.get('subject');
  const text = mail.text;

  // Determine what type of action it is
  if (subject.startsWith('Assignment Created - ')) {
    // add assignment
    let homeworkName = subject.substring(subject.indexOf("-") + 2, subject.lastIndexOf(","));
    let unparsedDate = text.substring(text.lastIndexOf("due") + 5, text.lastIndexOf("View the assignment")).trim();
    let parsedDate = dayjs(unparsedDate, 'MMM D    h:mma');
    if (!parsedDate.isValid()) {
        parsedDate = dayjs(unparsedDate, 'MMM D    ha');
    }
    // No due date
    if (!parsedDate.isValid()) {
      add.add(botClient, homeworkName, null, channelID);
    } else {
      add.add(botClient, homeworkName, parsedDate, channelID);
    }
  } else if (subject.startsWith('Assignment Due Date Changed: ')) {
    // edit assignment
    let homeworkName = subject.substring(subject.indexOf(":") + 2, subject.lastIndexOf(","));
    let unparsedDate = text.substring(text.lastIndexOf("due") + 5, text.lastIndexOf("View the assignment")).trim();
    let parsedDate = dayjs(unparsedDate, 'MMM D    h:mma');
    if (!parsedDate.isValid()) {
        parsedDate = dayjs(unparsedDate, 'MMM D    ha');
    }
    // No due date
    if (!parsedDate.isValid()) {
      edit.edit(botClient, homeworkName, 'none', homeworkName, channelID);
    } else {
      edit.edit(botClient, homeworkName, parsedDate, homeworkName, channelID);
    }
  } else if (text.includes('View announcement')) {
    // announce
    index.announce(`<@&${roleID}>\n**${subject.substring(0, subject.lastIndexOf(':'))}**\`\`\`\n${text.substring(0, text.lastIndexOf('View announcement')).trim()}\n\`\`\``);
  }
});

function parse(text) {
  let map = JSON.parse(fs.readFileSync('imapInfo.json')).classes;
  for (var key of map) {
    if (key.name == text) {
      return [key.id, helper.getRoleId(key.id)];
    }
  }
}

exports.start = (client) => {
    botClient = client;
    mailListener.start(); // start listening
    console.log('started imap listening');

    // stop listening
    // mailListener.stop();
}