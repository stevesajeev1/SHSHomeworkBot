# SHS Homework Bot
Discord bot in Node.js for reminding classmates of homework and other general announcements.

Moderators can add homework assignments to the system, and users on the server get a personalized view of the assignments and their respective due dates based on the roles they selected on the server. 
Assignments are also automatically added to the system by the bot through integration with the Canvas system. This is accomplished using the IMAP protocol and parsing the email notifications sent by Canvas.

The Discord bot also supports the sending of announcements. When an announcement is sent in Canvas, it is relayed through the bot, which mentions students with the appropriate role with the content of the announcement.
