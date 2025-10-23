import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const TICKET_CATEGORIES = [
  { label: '💰 Zakup', value: 'zakup' },
  { label: '💎 Odbiór', value: 'odbior' },
  { label: '📦 Sprzedaż', value: 'sprzedaz' },
  { label: '🔁 Wymiana', value: 'wymiana' },
  { label: '📋 Inne', value: 'inne' }
];

client.once('ready', () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// ───────────────────────────────
// Slash command /ticket setup
// ───────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'ticket' && interaction.options.getSubcommand() === 'setup') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: '❌ Nie masz uprawnień do tej komendy!', ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('💰 Kup Itemy × UTWÓRZ ZGŁOSZENIE')
      .setDescription(
        `**WAŻNE INFORMACJE**\n\n` +
        `• otwieranie ticketów bez powodu jest zabronione,\n` +
        `• administracja odpowiada w przeciągu **24h**,\n` +
        `• minimalna kwota zamówienia wynosi **10 PLN**,\n` +
        `• prowizja dla płatności **PaySafeCard wynosi 10%**.\n\n` +
        `📩 Wybierz odpowiednią kategorię, aby utworzyć zgłoszenie!`
      )
      .setImage('https://cdn.discordapp.com/attachments/1296880869777084460/1308918021074874428/OIP.webp') // twój obrazek
      .setFooter({ text: 'Anarchia.gg', iconURL: interaction.guild.iconURL() });

    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Wybierz kategorię...')
      .addOptions(TICKET_CATEGORIES);

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.reply({ embeds: [embed], components: [row] });
  }
});

// ───────────────────────────────
// Obsługa wyboru kategorii
// ───────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'ticket_category') return;

  const userRoleId = process.env.USER_ROLE_ID;
  if (!interaction.member.roles.cache.has(userRoleId))
    return interaction.reply({ content: '❌ Nie masz uprawnień do otwierania ticketów.', ephemeral: true });

  const category = interaction.values[0];
  const channelName = `${category}-${interaction.user.username}`;

  const ticketChannel = await interaction.guild.channels.create({
    name: channelName,
    type: 0,
    parent: process.env.TICKET_CATEGORY_ID,
    permissionOverwrites: [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: process.env.SUPPORT_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
    ]
  });

  // Formularz (Modal)
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${category}`)
    .setTitle(`Formularz | ${category.toUpperCase()}`);

  const serverInput = new TextInputBuilder()
    .setCustomId('server')
    .setLabel('NA JAKIM SERWERZE:')
    .setPlaceholder('Przykład: anarchia.gg, rapy.pl')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const itemInput = new TextInputBuilder()
    .setCustomId('item')
    .setLabel('CO CHCESZ KUPIĆ:')
    .setPlaceholder('Przykład: 100k$, elytra')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const priceInput = new TextInputBuilder()
    .setCustomId('price')
    .setLabel('ZA ILE CHCESZ KUPIĆ:')
    .setPlaceholder('Przykład: 10 PLN')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const paymentInput = new TextInputBuilder()
    .setCustomId('payment')
    .setLabel('JAKĄ METODĄ PŁATNOŚCI PŁACISZ:')
    .setPlaceholder('Przykład: BLIK, PaySafeCard')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const firstRow = new ActionRowBuilder().addComponents(serverInput);
  const secondRow = new ActionRowBuilder().addComponents(itemInput);
  const thirdRow = new ActionRowBuilder().addComponents(priceInput);
  const fourthRow = new ActionRowBuilder().addComponents(paymentInput);

  modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);
  await interaction.showModal(modal);

  // zapis kanału do usera
  client.ticketData = client.ticketData || {};
  client.ticketData[interaction.user.id] = { category, channelId: ticketChannel.id };
});

// ───────────────────────────────
// Formularz (Modal Submit)
// ───────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const userData = client.ticketData?.[interaction.user.id];
  if (!userData) return;

  const { channelId, category } = userData;
  const channel = await interaction.guild.channels.fetch(channelId);

  const server = interaction.fields.getTextInputValue('server');
  const item = interaction.fields.getTextInputValue('item');
  const price = interaction.fields.getTextInputValue('price');
  const payment = interaction.fields.getTextInputValue('payment');

  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle(`🎟️ Kup Itemy × ${category.toUpperCase()}`)
    .addFields(
      { name: '× Dane klienta:', value: `— Klient: ${interaction.user}\n— Nick: ${interaction.user.username}\n— ID: ${interaction.user.id}`, inline: false },
      { name: '× Zebrane informacje:', value: `— Serwer: ${server}\n— Kupuje: ${item}\n— Cena: ${price}\n— Płatność: ${payment}`, inline: false }
    )
    .setFooter({ text: 'Anarchia.gg', iconURL: interaction.guild.iconURL() });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('close_ticket').setLabel('Zamknij').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('settings_ticket').setLabel('Ustawienia').setStyle(ButtonStyle.Secondary)
  );

  await channel.send({ content: `<@&${process.env.SUPPORT_ROLE_ID}>`, embeds: [embed], components: [row] });
  await interaction.reply({ content: `✅ Ticket **${category}** został utworzony: ${channel}`, ephemeral: true });
});

// ───────────────────────────────
// Zamknięcie ticketa
// ───────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'close_ticket') {
    await interaction.reply({ content: '🔒 Ticket zostanie zamknięty za 5 sekund...', ephemeral: true });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
});

client.login(process.env.TOKEN);
// ───────────────────────────────
// Obsługa przycisku "Ustawienia"
// ───────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== 'settings_ticket') return;

  const supportRole = interaction.guild.roles.cache.get(process.env.SUPPORT_ROLE_ID);
  if (!interaction.member.roles.cache.has(supportRole.id)) {
    return interaction.reply({
      content: '❌ Nie masz uprawnień do zarządzania tym zgłoszeniem!',
      ephemeral: true
    });
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_settings_menu')
    .setPlaceholder('⚙️ Wybierz akcję...')
    .addOptions([
      {
        label: '📌 Przypnij wiadomość',
        description: 'Przypnij główny embed ticketa',
        value: 'pin'
      },
      {
        label: '🧹 Wyczyść wiadomości',
        description: 'Usuń 20 ostatnich wiadomości w kanale',
        value: 'clear'
      },
      {
        label: '🗑️ Usuń ticket',
        description: 'Zamknij i usuń kanał ticketa',
        value: 'delete'
      }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    content: '⚙️ **Panel ustawień ticketa:**',
    components: [row],
    ephemeral: true
  });
});

// ───────────────────────────────
// Wykonanie wybranej akcji z menu ustawień
// ───────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'ticket_settings_menu') return;

  const action = interaction.values[0];

  if (action === 'pin') {
    const lastMessage = (await interaction.channel.messages.fetch({ limit: 1 })).first();
    if (lastMessage) await lastMessage.pin();
    return interaction.reply({ content: '📌 Wiadomość została przypięta.', ephemeral: true });
  }

  if (action === 'clear') {
    const messages = await interaction.channel.messages.fetch({ limit: 20 });
    await interaction.channel.bulkDelete(messages);
    return interaction.reply({ content: '🧹 Ostatnie 20 wiadomości zostało usunięte.', ephemeral: true });
  }

  if (action === 'delete') {
    await interaction.reply({ content: '🗑️ Ticket zostanie usunięty za 5 sekund...', ephemeral: true });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
});
