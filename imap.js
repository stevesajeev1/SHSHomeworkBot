var MailListener = require("mail-listener-fixed2");
const config = require("./config.json");

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
  attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
});

mailListener.on("server:connected", function(){
  console.log("imapConnected");
});

mailListener.on("server:disconnected", function(){
  console.log("imapDisconnected");
});

mailListener.on("error", function(err){
  console.log(err);
});

mailListener.on("mail", function(mail, seqno, attributes){
  // mail processing code goes here
  if (mail.headers.get('from').value[0].address !== 'notifications@instructure.com') return;
  console.log(`Subject: ${mail.headers.get('subject')}`);
  console.log(`Text: ${mail.text}`);
});

exports.start = () => {
    mailListener.start(); // start listening
    console.log('started imap listening');

    // stop listening
    // mailListener.stop();
}