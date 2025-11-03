const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
});

const TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

// Kategorie z .env
const CATEGORY_BUY_SELL = process.env.CATEGORY_BUY_SELL;
const CATEGORY_CLAIM_GIVEAWAY = process.env.CATEGORY_CLAIM_GIVEAWAY;
const CATEGORY_PICKUP_ITEM = process.env.CATEGORY_PICKUP_ITEM;

// ===========================================
// 1️⃣ Komenda do wysłania panelu ticketów
// ===========================================
client.on("ready", async () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
});

// Możesz wysłać ten panel ręcznie (np. przez komendę lub ręcznie z kodu)
client.on("messageCreate", async (message) => {
  if (message.content === "!panel") {
    const embed = new EmbedBuilder()
      .setColor("#ff69b4")
      .setTitle("🎫 DonutOne Support Panel")
      .setDescription("Select a category to open a ticket:")
      .setFooter({ text: "DonutOne Tickets System" });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_category")
      .setPlaceholder("📂| Select the type of ticket")
      .addOptions([
        {
          label: "💸 Buy/Sell Skellys",
          description: "Kup lub sprzedaj spawner",
          value: "buy_sell",
          emoji: "💸",
        },
        {
          label: "🎁 Claim Giveaway",
          description: "Odbierz nagrodę z giveaway’a",
          value: "claim_giveaway",
          emoji: "🎁",
        },
        {
          label: "📩 Pick Up Purchased Item",
          description: "Odbierz zakupiony przedmiot",
          value: "pickup_item",
          emoji: "📩",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ===========================================
// 2️⃣ Tworzenie ticketu po wyborze kategorii
// ===========================================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "ticket_category") return;

  const value = interaction.values[0];
  let categoryId;
  let ticketName;
  let title;

  if (value === "buy_sell") {
    categoryId = CATEGORY_BUY_SELL;
    ticketName = `buy-sell-${interaction.user.username}`;
    title = "💸 Kup/Sprzedaj Skellys";
  } else if (value === "claim_giveaway") {
    categoryId = CATEGORY_CLAIM_GIVEAWAY;
    ticketName = `giveaway-${interaction.user.username}`;
    title = "🎁 Claim Giveaway";
  } else if (value === "pickup_item") {
    categoryId = CATEGORY_PICKUP_ITEM;
    ticketName = `pickup-${interaction.user.username}`;
    title = "📩 Pick Up Purchased Item";
  }

  // Sprawdzenie duplikatu ticketu
  const existing = interaction.guild.channels.cache.find(
    (ch) => ch.name === ticketName.toLowerCase()
  );
  if (existing) {
    return interaction.reply({
      content: `⚠️ you have open ticket: ${existing}`,
      ephemeral: true,
    });
  }

  // Tworzenie kanału
  const ticketChannel = await interaction.guild.channels.create({
    name: ticketName.toLowerCase(),
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
    ],
  });

  const embed = new EmbedBuilder()
    .setColor("#ff69b4")
    .setTitle(title)
    .setDescription(
      `🔔 **ticket opened by:** ${interaction.user}\n\n` +
      `The support team will contact you shortly.`
    )
    .setFooter({ text: "DonutOne • Ticket System" })
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
      .setLabel("🙋 Take Ticket")
      .setStyle(ButtonStyle.Primary)
  );

  await ticketChannel.send({
    content: `<@1434655987733631047> | ${interaction.user}`, // podmień ROLE_ID_SUPPORT na rolę staffu
    embeds: [embed],
    components: [buttons],
  });

  await interaction.reply({
    content: `✅ Ticket utworzony: ${ticketChannel}`,
    ephemeral: true,
  });
});

// ===========================================
// 3️⃣ Obsługa przycisków (zamknij/usuń/przejmij)
// ===========================================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const channel = interaction.channel;

  if (interaction.customId === "close_ticket") {
    await interaction.reply({ content: "🔒 Ticket close.", ephemeral: true });
    await channel.permissionOverwrites.edit(interaction.user.id, {
      ViewChannel: false,
    });
  } else if (interaction.customId === "delete_ticket") {
    await interaction.reply({ content: "🗑️ The ticket will be deleted in 5 seconds.", ephemeral: true });
    setTimeout(() => channel.delete().catch(() => {}), 5000);
  } else if (interaction.customId === "claim_tickett") {
    await interaction.reply({ content: `🙋 Ticket taken over by ${interaction.user}.`, ephemeral: false });
  }
});

client.login(TOKEN);
