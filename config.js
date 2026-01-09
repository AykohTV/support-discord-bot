module.exports = {
  PREFIX: '+',
  CLIENT_ID: 'BOT_ID',
  GUILD_ID: 'SERVER_ID',

  // Rôles
  ROLE_RESPONSABLE: 'RESP_ID',
  ROLE_GESTION: 'GESTION_ID',
  ROLE_DIRECTION: 'DIRECTION_ID',
  ROLE_STAFF: 'STAFF_ID',

  // Catégorie pour tickets
  TICKET_CATEGORY_ID: 'TICKET_CATEGORY_ID',

  // Salon pour créer les tickets
  TICKET_CHANNEL_ID: 'TICKET_CHANNEL_ID',

  // Salon pour logs tickets
  TICKET_LOGS_CHANNEL_ID: 'LOGS_TICKET_CHANNEL_ID',

  // Rôles par type de ticket
  TICKET_PERMISSIONS: {
    "Candidature Staff": ['STAFF_ID'],
    "Report Bug": ['STAFF_ID'],
    "Signalement": ['STAFF_ID'],
    "Devenir Bêta-Testeur": ['STAFF_ID'],
    "Autres..": ['STAFF_ID']
  },

  COLOR: 0xEC83FC

};
