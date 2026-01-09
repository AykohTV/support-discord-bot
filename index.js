const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');

const CONFIG = require('./config.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});



function embed(title, description) {
  return new EmbedBuilder()
    .setColor(CONFIG.COLOR)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}



client.on('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);

  const guild = client.guilds.cache.get(CONFIG.GUILD_ID);
  if (!guild) return;

  const updateStatus = () => {
    const count = guild.channels.cache.filter(
      c => c.parentId === CONFIG.TICKET_CATEGORY_ID && c.isTextBased()
    ).size;

    client.user.setActivity(
      `Aide ${count} joueurs sur Zone Aczion | SCP RP`,
      { type: 3 }
    );
  };

  updateStatus();
  setInterval(updateStatus, 30000);

  const channel = guild.channels.cache.get(CONFIG.TICKET_CHANNEL_ID);
  if (!channel) return;

  const menuEmbed = embed(
    '🎫 Support Zone Aczion | SCP RP',
    'Bienvenue sur le support de **Zone Aczion | SCP RP** !\n\n' +
    'Merci de cliquer sur la **catégorie correspondant à votre demande** ' +
    'et de **remplir le modèle demandé**.'
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_candidature').setLabel('Candidature Staff').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_bug').setLabel('Report Bug').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_signalement').setLabel('Signalement').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_beta').setLabel('Devenir Bêta-Testeur').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket_autres').setLabel('Autres..').setStyle(ButtonStyle.Secondary)
  );

  await channel.bulkDelete(10).catch(() => {});
  channel.send({ embeds: [menuEmbed], components: [row] });
});



const TICKETS = {
  ticket_candidature: {
    name: 'candidature',
    title: '📌 Candidature Staff',
    roles: CONFIG.TICKET_PERMISSIONS['Candidature Staff'],
    content: `
- **ID Discord :**
- **STEAM_ID :**

- **Motivations :**
- **Présentation IRL :**

- **Combien d'heures sur GMod :**
`
  },
  ticket_bug: {
    name: 'bug',
    title: '🐞 Report Bug',
    roles: CONFIG.TICKET_PERMISSIONS['Report Bug'],
    content: `
- **STEAM_ID :**
- **Description :**
- **Rec / Screen :**
`
  },
  ticket_signalement: {
    name: 'signalement',
    title: '🚨 Signalement',
    roles: CONFIG.TICKET_PERMISSIONS['Signalement'],
    content: `
- **STEAM_ID :**
- **STEAM_ID du concerné :**
- **Description du problème :**
- **Preuve :**
`
  },
  ticket_beta: {
    name: 'beta',
    title: '🧪 Devenir Bêta-Testeur',
    roles: CONFIG.TICKET_PERMISSIONS['Devenir Bêta-Testeur'],
    content: `
- **STEAM_ID :**
- **Motivations :**
- **Pourquoi devenir bêta-testeur :**
`
  },
  ticket_autres: {
    name: 'autres',
    title: '📂 Autres',
    roles: CONFIG.TICKET_PERMISSIONS['Autres..'],
    content: `Explique ta demande en détail :`
  }
};



client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const member = interaction.member;
  const channel = interaction.channel;

  
  if (TICKETS[interaction.customId]) {
    const data = TICKETS[interaction.customId];

    const overwrites = [
      { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
    ];

    data.roles.forEach(role => {
      if (role && role !== CONFIG.ROLE_DIRECTION) {
        overwrites.push({
          id: role,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        });
      }
    });

    const ticketChannel = await guild.channels.create({
      name: `🟠-${data.name}-${interaction.user.username}`,
      parent: CONFIG.TICKET_CATEGORY_ID,
      permissionOverwrites: overwrites
    });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_claim').setLabel('Prendre en charge').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger)
    );

    const mentions = data.roles
      .filter(r => r && r !== CONFIG.ROLE_DIRECTION)
      .map(r => `<@&${r}>`)
      .join(' ');

    await ticketChannel.send({
      content: mentions || null,
      embeds: [embed(data.title, data.content)],
      components: [buttons]
    });

    const logs = guild.channels.cache.get(CONFIG.TICKET_LOGS_CHANNEL_ID);
    if (logs) logs.send({ embeds: [embed('🎫 Ticket créé', `**Type :** ${data.title}\n**Auteur :** ${interaction.user}\n**Salon :** ${ticketChannel}`)] });

    return interaction.reply({ content: '✅ Ticket créé.', ephemeral: true });
  }

  
  if (interaction.customId === 'ticket_claim') {
    const isDirection = member.roles.cache.has(CONFIG.ROLE_DIRECTION);

    const allowedRoles = channel.permissionOverwrites.cache
      .filter(p => p.type === 0 && p.allow.has(PermissionsBitField.Flags.ViewChannel))
      .map(p => p.id);

    const isAllowed = member.roles.cache.some(r => allowedRoles.includes(r.id));

    if (!isDirection && !isAllowed) {
      return interaction.reply({ content: '❌ Tu ne peux pas prendre ce ticket.', ephemeral: true });
    }

    await channel.setName(`🟢-${channel.name.replace(/^🟠-|^🟢-|^🔴-/, '')}`);
    await channel.send({ embeds: [embed('🟢 Ticket pris en charge', `Pris en charge par ${member}`)] });
    const logs = interaction.guild.channels.cache.get(CONFIG.TICKET_LOGS_CHANNEL_ID);
   if (logs) {
  logs.send({
    embeds: [
      embed(
        '🟢 Ticket pris en charge',
        `**Salon :** ${channel}\n**Pris par :** ${member}`
      )
    ]
  });
  }

    return interaction.reply({ content: '✅ Ticket pris.', ephemeral: true });
  }

  
  if (interaction.customId === 'ticket_close') {
    await channel.setName(`🔴-${channel.name.replace(/^🟠-|^🟢-|^🔴-/, '')}`);

    const deleteRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_delete').setLabel('Supprimer le ticket').setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      embeds: [embed('🔴 Ticket fermé', `Ticket fermé par ${member}`)],
      components: [deleteRow]
    });

    const logs = interaction.guild.channels.cache.get(CONFIG.TICKET_LOGS_CHANNEL_ID);
  if (logs) {
  logs.send({
    embeds: [
      embed(
        '🔴 Ticket fermé',
        `**Salon :** ${channel}\n**Fermé par :** ${member}`
      )
    ]
  });
  }


    return interaction.reply({ content: '🔒 Ticket fermé.', ephemeral: true });
  }

  
  if (interaction.customId === 'ticket_delete') {
  const logs = interaction.guild.channels.cache.get(CONFIG.TICKET_LOGS_CHANNEL_ID);

  if (logs) {
    logs.send({
      embeds: [
        embed(
          '🗑️ Ticket supprimé',
          `**Salon :** ${channel.name}\n**Supprimé par :** ${interaction.member}`
        )
      ]
    });
  }

  await interaction.reply({
    content: '🗑️ Suppression du ticket...',
    ephemeral: true
  });

  setTimeout(() => {
    channel.delete().catch(() => {});
  }, 2000);
  }

});



client.login('TOKEN_BOT');
