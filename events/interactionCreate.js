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
      switch (interaction.customId) {
        case 'addClass': {
          client.slashcmds.get(interaction.message.interaction.commandName).successfulAddition(client, interaction);
          break;
        }
        case 'editHomework': {
          client.slashcmds.get(interaction.message.interaction.commandName).successfulEdit(client, interaction);
          break;
        }
        case 'deleteHomework': {
          client.slashcmds.get(interaction.message.interaction.commandName).successfulDeletion(client, interaction);
          break;
        }
        case 'announce': {
          client.slashcmds.get(interaction.message.interaction.commandName).successfulAnnouncement(client, interaction);
          break;
        }
      }
      return;
    }

    // If it doesn't apply, return
    return;
  };