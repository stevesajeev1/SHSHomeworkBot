const Imap = require('node-imap');
const xoauth2 = require('xoauth2');
const util = require('util');
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

function mail(mail) {
  // mail processing code goes here
  if (mail.address !== 'notifications@instructure.com') return;
  // parse role
  let channelID = parse(mail.name)[0];
  let roleID = parse(mail.name)[1];

  const subject = mail.subject;
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

exports.start = (client, debug) => {
    botClient = client;
    debugging = debug;

    let tokenGen = xoauth2.createXOAuth2Generator({
      user: config.imapEmail,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken
    });
    
    tokenGen.getToken((err, token) => {
        if (err) {
            return console.log(err);
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
            console.log('imap is ready');
            openInbox(imap);
        });
    
        imap.on('error', (err) => {
          console.log('IMAP error: ' + err);
          if (err.message == "Invalid credentials (Failure)") {
            tokenGen.updateToken();
            tokenGen.on('token', (token) => {
                imap.xoauth2 = token;
                console.log('rebooting imap');
                imap.connect();
            });
          } else {
            console.log('rebooting imap');
            imap.connect();
          }
      });
    
        imap.on('mail', () => {
            imap.search([ ['OR', 'UNSEEN', 'NEW'], ['FROM', 'notifications@instructure.com'] ], (err, results) => {
                if (!results || !results.length) {
                    return;
                }
                if (err) {
                    console.log('Error searching for new message: ' + err);
                }
                imap.setFlags(results, ['\\Seen'], (err) => {
                    if (err) {
                        console.log('Error marking messages as seen: ' + err);
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
                            parsedText = parsedText.substring(0, parsedText.lastIndexOf("\n")).trim();
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
                      mail(mail);
                    })
                });
                f.once('error', (err) => {
                    console.log('Fetch error: ' + err);
                });
            });
        })
    
        imap.connect();
    });
}

function openInbox(imap) {
  imap.openBox('INBOX', false, (err, box) => {
      if (err) {
          throw err;
      }
      // check if there were any emails before startup
      imap.search([ 'UNSEEN', ['FROM', 'notifications@instructure.com'] ], (err, results) => {
          if (!results || !results.length) {
              return;
          }
          if (err) {
              console.log('Error searching for unseen messages: ' + err);
          }
          imap.setFlags(results, ['\\Seen'], (err) => {
              if (err) {
                  console.log('Error marking messages as seen: ' + err);
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
                    parsedText = parsedText.substring(0, parsedText.lastIndexOf("\n")).trim();
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
                mail(mail);
              })
          });
          f.once('error', (err) => {
              console.log('Fetch error: ' + err);
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