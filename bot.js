require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// === PANEL KOMENDY ===
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content === "!panel") {
    const embed = new EmbedBuilder()
      .setColor("#00ffff")
      .setTitle("🎫 Ticket Panel")
      .setDescription("Wybierz kategorię, aby otworzyć ticket.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("buy_sell")
        .setLabel("💸 Buy/Sell Skellys")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("giveaway")
        .setLabel("🎁 Claim Giveaway")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("sponsor")
        .setLabel("👨‍💼 Sponsor Loot Drop")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("pickup")
        .setLabel("📩 Pick Up Purchased Item")
        .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// === INTERAKCJA — FORMULARZ ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId } = interaction;
  let modal;

  if (customId === "buy_sell") {
    modal = new ModalBuilder()
      .setCustomId("modal_buy_sell")
      .setTitle("💸 Buy/Sell Skellys Ticket");

    const ign = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Your Minecraft IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const amount = new TextInputBuilder()
      .setCustomId("amount")
      .setLabel("Amount (or what you're selling)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ign),
      new ActionRowBuilder().addComponents(amount)
    );
  }

  if (customId === "giveaway") {
    modal = new ModalBuilder()
      .setCustomId("modal_giveaway")
      .setTitle("🎁 Claim Giveaway");

    const ign = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Your Minecraft IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reward = new TextInputBuilder()
      .setCustomId("reward")
      .setLabel("What did you win?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ign),
      new ActionRowBuilder().addComponents(reward)
    );
  }

  if (customId === "sponsor") {
    modal = new ModalBuilder()
      .setCustomId("modal_sponsor")
      .setTitle("👨‍💼 Sponsor Loot Drop");

    const ign = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Your Minecraft IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const details = new TextInputBuilder()
      .setCustomId("details")
      .setLabel("What things do you want to give?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ign),
      new ActionRowBuilder().addComponents(details)
    );
  }

  if (customId === "pickup") {
    modal = new ModalBuilder()
      .setCustomId("modal_pickup")
      .setTitle("📩 Pick Up Purchased Item");

    const ign = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Your Minecraft IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const item = new TextInputBuilder()
      .setCustomId("item")
      .setLabel("What item did you purchase?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ign),
      new ActionRowBuilder().addComponents(item)
    );
  }

  await interaction.showModal(modal);
});

// === TWORZENIE TICKETU ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const user = interaction.user;
  let categoryId, title, description;

  if (interaction.customId === "modal_buy_sell") {
    categoryId = process.env.CATEGORY_BUY_SELL_ID;
    title = "💸 Buy/Sell Skellys";
    description = `IGN: **${interaction.fields.getTextInputValue("ign")}**\nAmount/Offer: **${interaction.fields.getTextInputValue("amount")}**`;
  }

  if (interaction.customId === "modal_giveaway") {
    categoryId = process.env.CATEGORY_GIVEAWAY_ID;
    title = "🎁 Claim Giveaway";
    description = `IGN: **${interaction.fields.getTextInputValue("ign")}**\nReward: **${interaction.fields.getTextInputValue("reward")}**`;
  }

  if (interaction.customId === "modal_sponsor") {
    categoryId = process.env.CATEGORY_SPONSOR_ID;
    title = "👨‍💼 Sponsor Loot Drop";
    description = `IGN: **${interaction.fields.getTextInputValue("ign")}**\nDetails: **${interaction.fields.getTextInputValue("details")}**`;
  }

  if (interaction.customId === "modal_pickup") {
    categoryId = process.env.CATEGORY_PICKUP_ID;
    title = "📩 Pick Up Purchased Item";
    description = `IGN: **${interaction.fields.getTextInputValue("ign")}**\nItem: **${interaction.fields.getTextInputValue("item")}**`;
  }

  const ticketChannel = await interaction.guild.channels.create({
    name: `ticket-${user.username}`,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: user.id, allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]}
    ]
  });

  const embed = new EmbedBuilder()
    .setColor("#00ffcc")
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: `Ticket created by ${user.tag}` })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 Close Ticket")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("delete_ticket")
      .setLabel("🗑️ Delete Ticket")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("claim_ticket")
      .setLabel("🙋 Claim Ticket")
      .setStyle(ButtonStyle.Primary)
  );

  await ticketChannel.send({
    content: `🎟️ <@${user.id}>`,
    embeds: [embed],
    components: [buttons]
  });

  await interaction.reply({
    content: `✅ Your ticket has been created: ${ticketChannel}`,
    ephemeral: true
  });
});

// === OBSŁUGA PRZYCISKÓW TICKETU ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId, channel, user } = interaction;

  if (customId === "close_ticket") {
    await channel.permissionOverwrites.edit(user.id, { SendMessages: false });
    await interaction.reply({ content: "🔒 Ticket closed.", ephemeral: true });
  }

  if (customId === "delete_ticket") {
    await interaction.reply({ content: "🗑️ Deleting ticket...", ephemeral: true });
    setTimeout(() => channel.delete(), 3000);
  }

  if (customId === "claim_ticket") {
    await interaction.reply({ content: `🙋 Ticket claimed by <@${user.id}>.` });
  }
});

client.login(process.env.BOT_TOKEN);
