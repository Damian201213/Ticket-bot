require("dotenv").config();
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
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");

// === KONFIGURACJA KLIENTA ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// === REJESTRACJA KOMENDY /panel ===
const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("📩 Wyślij panel ticketów (dla administratorów)"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔄 Rejestrowanie komendy /panel...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("✅ Komenda /panel zarejestrowana!");
  } catch (err) {
    console.error("❌ Błąd rejestracji komend:", err);
  }
})();

// === OBSŁUGA KOMENDY /panel ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "panel") return;

  // tylko adminy
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    return interaction.reply({
      content: "🚫 Nie masz uprawnień do tej komendy.",
      ephemeral: true,
    });
  }

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

  await interaction.channel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: "✅ Panel ticketów wysłany!", ephemeral: true });
});

// === OBSŁUGA PRZYCISKÓW (otwieranie modali) ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId } = interaction;
  let modal;

  if (customId === "buy_sell") {
    modal = new ModalBuilder()
      .setCustomId("modal_buy_sell")
      .setTitle("💸 Buy/Sell Skellys Ticket");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ign")
          .setLabel("Your Minecraft IGN")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("amount")
          .setLabel("Amount (or what you're selling)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );
  }

  if (customId === "giveaway") {
    modal = new ModalBuilder()
      .setCustomId("modal_giveaway")
      .setTitle("🎁 Claim Giveaway");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ign")
          .setLabel("Your Minecraft IGN")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reward")
          .setLabel("What did you win?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );
  }

  if (customId === "sponsor") {
    modal = new ModalBuilder()
      .setCustomId("modal_sponsor")
      .setTitle("👨‍💼 Sponsor Loot Drop");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ign")
          .setLabel("Your Minecraft IGN")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("details")
          .setLabel("What do you want to sponsor?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );
  }

  if (customId === "pickup") {
    modal = new ModalBuilder()
      .setCustomId("modal_pickup")
      .setTitle("📩 Pick Up Purchased Item");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ign")
          .setLabel("Your Minecraft IGN")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("item")
          .setLabel("What item did you purchase?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
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
    components: [buttons],
  });

  await interaction.reply({
    content: `✅ Your ticket has been created: ${ticketChannel}`,
    ephemeral: true,
  });
});

// === OBSŁUGA PRZYCISKÓW W TICKETACH ===
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

// === START BOTA ===
client.once("ready", () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
});

client.login(TOKEN);
