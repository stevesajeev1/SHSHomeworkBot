const Imap = require('node-imap');
const xoauth2 = require('xoauth2');
const config = require('./config.json');
const util = require('util');

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
          console.log('rebooting imap');
          imap.end();
          imap.connect();
      });
  
      imap.on('mail', () => {
          imap.search([ ['OR', 'UNSEEN', 'NEW'], ['FROM', 'stevesajeev123@gmail.com'] ], (err, results) => {
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
                          console.log("HEADERS:\n" + util.inspect(Imap.parseHeader(headers)));
                      }
                  })
              });
              f.once('error', (err) => {
                  console.log('Fetch error: ' + err);
              });
          });
      })
  
      imap.connect();
  });

function openInbox(imap) {
    imap.openBox('INBOX', false, (err, box) => {
        if (err) {
            throw err;
        }
        // check if there were any emails before startup
        imap.search([ 'UNSEEN', ['FROM', 'stevesajeev123@gmail.com'] ], (err, results) => {
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
                msg.on('body', async (stream, info) => {
                    if (info.which === 'TEXT') {
                        let rawText = await streamToString(stream);
                        let plainText = rawText.substring(rawText.indexOf("UTF-8") + 7, rawText.indexOf("text/html")).trim();
                        let parsedText = plainText.substring(0, plainText.lastIndexOf("\n")).trim();
                        parsedText = parsedText.substring(0, parsedText.lastIndexOf("\n")).trim();
                        console.log("BODY:\n" + parsedText);
                    } else {
                        let headers = await streamToString(stream);
                        console.log(Imap.parseHeader(headers)['from'][0]);
                        console.log(Imap.parseHeader(headers)['subject'][0]);
                    }
                })
            });
            f.once('error', (err) => {
                console.log('Fetch error: ' + err);
            });
        });
    });
}

function streamToString (stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
  }
  