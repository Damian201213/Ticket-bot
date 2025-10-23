import {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  SlashCommandBuilder,
  Routes,
  REST,
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

// ====================== KONFIGURACJA ====================== //
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// ====================== REJESTRACJA KOMENDY /setup ====================== //
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: [
        new SlashCommandBuilder()
          .setName("ticket")
          .setDescription("Zarządzanie systemem ticketów")
          .addSubcommand((sub) => sub.setName("setup").setDescription("Utwórz panel ticketów")),
      ],
    });
    console.log("✅ Zarejestrowano komendę /ticket setup");
  } catch (error) {
    console.error("❌ Błąd rejestracji komendy:", error);
  }
})();

// ====================== SYSTEM TICKETÓW ====================== //
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ===== KOMENDA /ticket setup ===== //
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "ticket" && interaction.options.getSubcommand() === "setup") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
        return interaction.reply({ content: "❌ Musisz być administratorem, aby użyć tej komendy.", ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle("📩 Kup Itemy")
        .setDescription("Wybierz odpowiednią kategorię, aby utworzyć zgłoszenie!")
        .setColor("Yellow")
        .setImage("https://cdn.discordapp.com/attachments/1286396028403906603/1309213644217427978/anarchiagg.png");

      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("Wybierz kategorię...")
        .addOptions([
          { label: "💰 Zakup", value: "zakup" },
          { label: "📦 Odbiór", value: "odbior" },
          { label: "💵 Sprzedaż", value: "sprzedaz" },
          { label: "🔄 Wymiana", value: "wymiana" },
          { label: "❓ Inne", value: "inne" },
        ]);

      const row = new ActionRowBuilder().addComponents(menu);
      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // ===== MENU WYBORU ===== //
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {
    const USER_ROLE_ID = process.env.USER_ROLE_ID;
    if (!interaction.member.roles.cache.has(USER_ROLE_ID)) {
      return interaction.reply({
        content: `🚫 Nie masz uprawnień, aby utworzyć ticket. Wymagana rola: <@&${USER_ROLE_ID}>.`,
        ephemeral: true,
      });
    }

    const option = interaction.values[0];
    const modale = new ModalBuilder().setTitle("Kup Itemy").setCustomId(`modal_${option}`);

    if (option === "zakup") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server").setLabel("NA JAKIM SERWERZE:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("item").setLabel("CO CHCESZ KUPIĆ:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("price").setLabel("ZA ILE CHCESZ KUPIĆ:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("payment").setLabel("JAKĄ METODĄ PŁATNOŚCI:").setStyle(TextInputStyle.Short).setRequired(true))
      );
    }

    if (option === "odbior") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server").setLabel("NA JAKIM SERWERZE:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("item").setLabel("CO CHCESZ ODEBRAĆ:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("reason").setLabel("ZA CO CHCESZ ODEBRAĆ:").setStyle(TextInputStyle.Short).setRequired(true))
      );
    }

    if (option === "sprzedaz") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server").setLabel("NA JAKIM SERWERZE:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("item").setLabel("CO CHCESZ SPRZEDAĆ:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("price").setLabel("ZA ILE CHCESZ SPRZEDAĆ:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("payment").setLabel("METODA PŁATNOŚCI:").setStyle(TextInputStyle.Short).setRequired(true))
      );
    }

    if (option === "wymiana") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("from").setLabel("Z JAKIEGO SERWERA:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("to").setLabel("NA JAKI SERWER:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("give").setLabel("CO WYMIENIASZ:").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("get").setLabel("CO OTRZYMUJESZ:").setStyle(TextInputStyle.Short).setRequired(true))
      );
    }

    if (option === "inne") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("desc").setLabel("OPISZ SWOJĄ SPRAWĘ:").setStyle(TextInputStyle.Paragraph).setRequired(true))
      );
    }

    await interaction.showModal(modale);
  }

  // ===== MODALE ===== //
  if (interaction.isModalSubmit()) {
    const type = interaction.customId.split("_")[1];
    const categories = {
      zakup: process.env.CATEGORY_ZAKUP,
      odbior: process.env.CATEGORY_ODBIOR,
      sprzedaz: process.env.CATEGORY_SPRZEDAZ,
      wymiana: process.env.CATEGORY_WYMIANA,
      inne: process.env.CATEGORY_INNE,
    };
    const categoryId = categories[type];
    const guild = interaction.guild;
    const user = interaction.user;

    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: 0,
      parent: categoryId,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: process.env.SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎟️ Kup Itemy × ${type.toUpperCase()}`)
      .setDescription(`**Dane klienta:** ${user}\n**Typ zgłoszenia:** ${type}`)
      .setColor("Yellow")
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_ticket").setLabel("Zamknij").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("settings_ticket").setLabel("Ustawienia").setStyle(ButtonStyle.Secondary)
    );

    await ticketChannel.send({ embeds: [embed], components: [buttons] });
    await interaction.reply({ content: `✅ Ticket utworzony: ${ticketChannel}`, ephemeral: true });
  }
});

// ====================== START ====================== //
client.login(process.env.TOKEN);
