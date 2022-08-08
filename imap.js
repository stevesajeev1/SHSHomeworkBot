const Imap = require('node-imap');
const { Client, Intents } = require("discord.js");
const xoauth2 = require('xoauth2');
const fs = require('fs');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat')
const config = require("./config.json");
const helper = require("./helper/helper.js");
const add = require("./slash/add.js");
const edit = require("./slash/edit.js");
const mimelib = require("mimelib");

dayjs.extend(customParseFormat);

function mailProcessing(mail) {
  // mail processing code goes here
  if (mail.address !== 'notifications@instructure.com') return;
  // parse role
  let channelID = parse(mail.name)[0];
  let roleID = parse(mail.name)[1];

  const subject = mail.subject;
  const text = mail.text;

  // Determine what type of action it is
  if (subject.startsWith("Updated Page: ")) return;

  if (subject.startsWith('Assignment Created - ')) {
    // add assignment
    let homeworkName = subject.substring(subject.indexOf("-") + 2, subject.lastIndexOf(",")).trim();
    let unparsedDate = text.substring(text.lastIndexOf("due") + 5, text.lastIndexOf("Click")).trim().replace(' at ', ' ').replace(/  +/g, ' ');
    let parsedDate = dayjs(unparsedDate, 'MMM D h:mma');
    if (!parsedDate.isValid()) {
        parsedDate = dayjs(unparsedDate, 'MMM D ha');
    }
    // No due date
    if (!parsedDate.isValid()) {
      add.add(client, homeworkName, null, channelID);
    } else {
      add.add(client, homeworkName, parsedDate, channelID);
    }
  } else if (subject.startsWith('Assignment Due Date Changed: ')) {
    // edit assignment
    let homeworkName = subject.substring(subject.indexOf(":") + 2, subject.lastIndexOf(",")).trim();
    let unparsedDate = text.substring(text.lastIndexOf("to:") + 3, text.lastIndexOf("Click")).trim().replace(' at ', ' ').replace(/  +/g, ' ');
    let parsedDate = dayjs(unparsedDate, 'MMM D h:mma');
    if (!parsedDate.isValid()) {
        parsedDate = dayjs(unparsedDate, 'MMM D ha');
    }
    parsedDate = dayjs(unparsedDate, 'MMM D ha');
    // No due date
    if (!parsedDate.isValid()) {
      edit.edit(client, homeworkName, 'none', homeworkName, channelID);
    } else {
      edit.edit(client, homeworkName, parsedDate, homeworkName, channelID);
    }
  } else if (text.includes('/announcements/')) {
    // announce
    announce(`<@&${roleID}>\n**${subject.substring(0, subject.lastIndexOf(':'))}**\`\`\`\n${text.substring(0, text.lastIndexOf('________________________________________')).trim()}\n\`\`\``);
  } else {
    debug(subject);
    return;
  }
};

function start() {
    let tokenGen = xoauth2.createXOAuth2Generator({
      user: config.imapEmail,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken
    });
    
    tokenGen.getToken((err, token) => {
        if (err) {
            console.log(err);
            throw err;
        }
    
        let imap = new Imap({
            xoauth2: token,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false
            },
            keepalive: {
                interval: 10 * 1000,
                idleInterval: 60 * 1000,
                forceNoop: true
            }
        });
        
        imap.on('ready', () => {
            openInbox(imap);
            console.log('imap is ready');
        });

        imap.on('error', (err) => {
          console.log("IMAP Error: " + err);
          throw err;
        });

        imap.on('close', (hadErr) => {
          console.log(hadErr ? "IMAP Closed with Error" : "IMAP Closed");
          tokenGen.getToken((err, token) => {
            if (err) {
              console.log(err);
              throw err;
            }
            imap.xoauth2 = token;
            console.log('rebooting imap');
            imap.connect();
          });
        });
    
        imap.on('mail', () => {
            imap.search([ ['OR', 'UNSEEN', 'NEW'], ['FROM', 'notifications@instructure.com'] ], (err, results) => {
                if (!results || !results.length) {
                    return;
                }
                if (err) {
                    console.log('Error searching for new message: ' + err);
                    throw err;
                }
                imap.setFlags(results, ['\\Seen'], (err) => {
                    if (err) {
                        console.log('Error marking messages as seen: ' + err);
                        throw err;
                    }
                });
                const f = imap.fetch(results, { 
                    bodies: ['HEADER.FIELDS (FROM SUBJECT)', 'TEXT'],
                    markSeen: true
                });
                f.on('message', (msg) => {
                    let mail = {};
                    msg.on('body', async (stream, info) => {
                        if (info.which === 'TEXT') {
                            let rawText = await streamToString(stream);
                            let plainText = rawText.substring(rawText.indexOf("UTF-8") + 7, rawText.indexOf("text/html")).trim();
                            let parsedText = plainText.substring(0, plainText.lastIndexOf("\n")).trim();
                            parsedText = mimelib.decodeQuotedPrintable(parsedText.substring(0, parsedText.lastIndexOf("\n")).trim()).substring(43).trim();
                            mail.text = parsedText;
                        } else {
                            let headers = await streamToString(stream);
                            let from = Imap.parseHeader(headers)['from'][0];
                            mail.name = from.substring(0, from.lastIndexOf(" "));
                            mail.address = from.substring(from.indexOf("<") + 1, from.indexOf(">"));
                            mail.subject = Imap.parseHeader(headers)['subject'][0];
                        }
                    });
                    msg.once('end', () => {
                      mailProcessing(mail);
                    })
                });
                f.once('error', (err) => {
                    console.log('Fetch error: ' + err);
                    throw err;
                });
            });
        });
    
        imap.connect();
    });
}

function openInbox(imap) {
  imap.openBox('INBOX', false, (err, box) => {
      if (err) {
          throw err;
      }
      // check if there were any emails before startup
      imap.search([ ['OR', 'UNSEEN', 'NEW'], ['FROM', 'notifications@instructure.com'] ], (err, results) => {
          if (!results || !results.length) {
              return;
          }
          if (err) {
              console.log('Error searching for unseen messages: ' + err);
              throw err;
          }
          imap.setFlags(results, ['\\Seen'], (err) => {
              if (err) {
                  console.log('Error marking messages as seen: ' + err);
                  throw err;
              }
          });
          const f = imap.fetch(results, { 
              bodies: ['HEADER.FIELDS (FROM SUBJECT)', 'TEXT'],
              markSeen: true
          });
          f.on('message', (msg) => {
            let textStream, headerStream;
            msg.on('body', async (stream, info) => {
                if (info.which === 'TEXT') {
                    textStream = stream;
                } else {
                    headerStream = stream;
                }
              });
              msg.once('end', async () => {
                let mail = {};
                let rawText = await streamToString(textStream);
                let plainText = rawText.substring(rawText.indexOf("UTF-8") + 7, rawText.indexOf("text/html")).trim();
                let parsedText = plainText.substring(0, plainText.lastIndexOf("\n")).trim();
                parsedText = mimelib.decodeQuotedPrintable(parsedText.substring(0, parsedText.lastIndexOf("\n")).trim()).substring(43).trim();
                mail.text = parsedText;
                let headers = await streamToString(headerStream);
                let from = Imap.parseHeader(headers)['from'][0];
                mail.name = from.substring(0, from.lastIndexOf(" "));
                mail.address = from.substring(from.indexOf("<") + 1, from.indexOf(">"));
                mail.subject = Imap.parseHeader(headers)['subject'][0];
                mailProcessing(mail);
              })
          });
          f.once('error', (err) => {
              console.log('Fetch error: ' + err);
              throw err;
          });
      });
  });
}


function parse(text) {
  let map = JSON.parse(fs.readFileSync('imapInfo.json')).classes;
  for (var key of map) {
    if (key.name == text) {
      return [key.id, helper.getRoleId(key.id)];
    }
  }
}

function streamToString (stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

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
  ],
  ws: {
    properties: {
      $browser: "Discord iOS"
    }
  }
});

client.login(config.token);

client.on("ready", () => {
  start();
});

function announce(text) {
  try {
    client.channels.cache.get(config.announcement).send(text);
  } catch (e) {}
}

function debug(text) {
  client.users.fetch(config.ownerID, false).then((user) => {
    user.send('```\n' + text + '\n```');
  });
}