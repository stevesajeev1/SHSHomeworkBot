module.exports = async (client, interaction) => {
    // If it is a command
    if (interaction.isCommand()) {
      // Grab the command client.slashcmds Enmap
      const cmd = client.slashcmds.get(interaction.commandName);
      
      // If that command doesn't exist, silently exit and do nothing
      if (!cmd) return;
    
      cmd.run(client, interaction);
      return;
    }
    // If it is a selection menu update
    if (interaction.isSelectMenu()) {
      client.slashcmds.get(interaction.message.interaction.commandName).selectionMenu(client, interaction);
      return;
    }
    
    // If it is a modal submission
    if (interaction.isModalSubmit()) {
      client.slashcmds.get(interaction.message.interaction.commandName).modal(client, interaction);
      return;
    }

    // If it doesn't apply, return
    return;
  };