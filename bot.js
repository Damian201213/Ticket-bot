require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');

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
      .setTitle("🎟️ Ticket Panel")
      .setDescription("✨ Select a category to open a ticket.");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("🎫 | choose an option")
      .addOptions([
        {
          label: "💸 Buy/Sell Skellys",
          description: "buy or sell skellys",
          value: "buy_sell",
        },
        {
          label: "🎁 Claim Giveaway",
          description: "Claim your prize",
          value: "claim_giveaway",
        },
        {
          label: "👨‍💼 Sponsor Loot Drop",
          description: "give items",
          value: "sponsor_drop",
        },
        {
          label: "📩 Pick Up The Purchased Item",
          description: "Odbierz zakupiony przedmiot",
          value: "pickup_item",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// === INTERAKCJA — WYBÓR KATEGORII ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "ticket_select") return;

  const value = interaction.values[0];
  let modal;

  // Różne formularze dla każdej kategorii
  if (value === "buy_sell") {
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

  if (value === "claim_giveaway") {
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

  if (value === "sponsor_lootdrop") {
    modal = new ModalBuilder()
      .setCustomId("modal_sponsor")
      .setTitle("👨‍💼 Sponsor Loot Drop");

    const ign = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Your Minecraft IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const details = new TextInputBuilder()
      .setCustomId("items for loot drop")
      .setLabel("What things do you want to give?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(sponsorName),
      new ActionRowBuilder().addComponents(details)
    );
  }

  if (value === "pickup_item") {
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

// === FORMULARZE (modale) ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const user = interaction.user;
  let categoryId, title, description;

  // ✅ Dane dla każdej kategorii
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
    description = `Sponsor: **${interaction.fields.getTextInputValue("sponsor_name")}**\nDetails: **${interaction.fields.getTextInputValue("details")}**`;
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
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
    ],
  });

  const embed = new EmbedBuilder()
    .setColor("#00ffcc")
    .setTitle(`${title}`)
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
    components: [buttons],
  });

  await interaction.reply({
    content: `✅ Your ticket has been created: ${ticketChannel}`,
    ephemeral: true,
  });
});

// === PRZYCISKI W TICKETACH ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId, channel, user } = interaction;

  if (customId === "close_ticket") {
    await channel.permissionOverwrites.edit(user.id, {
      SendMessages: false,
    });
    await interaction.reply({
      content: "🔒 Ticket closed.",
      ephemeral: true,
    });
  }

  if (customId === "delete_ticket") {
    await interaction.reply({ content: "🗑️ Deleting ticket...", ephemeral: true });
    setTimeout(() => channel.delete(), 3000);
  }

  if (customId === "claim_ticket") {
    await interaction.reply({
      content: `🙋 Ticket claimed by <@${user.id}>.`,
    });
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.BOT_TOKEN);
