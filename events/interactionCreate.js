module.exports = async (client, interaction) => {
    // If it's not a command, stop.
    if (!interaction.isCommand()) return;
  
    // Grab the command client.slashcmds Enmap
    const cmd = client.slashcmds.get(interaction.commandName);
    
    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return;
  
    cmd.run(client, interaction);
  };