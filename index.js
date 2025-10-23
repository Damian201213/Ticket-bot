import {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  SlashCommandBuilder,
  Routes,
  REST
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

// ✅ Rejestracja komendy /ticket setup
const commands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("System ticketów")
    .addSubcommand(sub =>
      sub
        .setName("setup")
        .setDescription("Utwórz panel ticketów w tym kanale.")
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("✅ Zarejestrowano komendę /ticket setup");
  } catch (error) {
    console.error(error);
  }
})();

client.once("ready", () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// ============ PANEL SETUP ============ //
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "ticket" && interaction.options.getSubcommand() === "setup") {
    if (!interaction.member.roles.cache.has(process.env.SUPPORT_ROLE_ID))
      return interaction.reply({ content: "❌ Nie masz uprawnień do tworzenia panelu.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle("💰 Kup Itemy")
      .setDescription("Wybierz odpowiednią kategorię, aby utworzyć zgłoszenie!")
      .setImage("https://i.imgur.com/rzD2rQh.png") // <- tu możesz dać logo Anarchia.gg
      .setColor("Yellow");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("zakup").setLabel("💰 Zakup").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("odbior").setLabel("📦 Odbiór").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("sprzedaz").setLabel("💵 Sprzedaż").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("wymiana").setLabel("🔁 Wymiana").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("inne").setLabel("❓ Inne").setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: "✅ Panel ticketów został utworzony!", ephemeral: true });
  }
});

// ============ INTERAKCJE ============ //
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return;

  // --- Formularze ---
  if (interaction.isButton()) {
    const userRole = interaction.member.roles.cache.has(process.env.USER_ROLE_ID);
    if (!userRole && !interaction.member.roles.cache.has(process.env.SUPPORT_ROLE_ID))
      return interaction.reply({ content: "❌ Tylko użytkownicy z odpowiednią rangą mogą tworzyć tickety.", ephemeral: true });

    const modale = new ModalBuilder()
      .setTitle("Kup Itemy")
      .setCustomId(`modal_${interaction.customId}`);

    if (interaction.customId === "zakup") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server").setLabel("NA JAKIM SERWERZE:").setPlaceholder("np. anarchia.gg lf").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("item").setLabel("CO CHCESZ KUPIĆ:").setPlaceholder("np. elytrę, 100k$").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("price").setLabel("ZA ILE CHCESZ KUPIĆ:").setPlaceholder("np. 10 PLN").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("method").setLabel("JAKĄ METODĄ PŁACISZ:").setPlaceholder("np. BLIK, PaySafeCard, Przelew").setStyle(TextInputStyle.Short).setRequired(true))
      );
    }

    if (interaction.customId === "odbior") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server").setLabel("NA JAKIM SERWERZE:").setPlaceholder("np. anarchia.gg lf").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("item").setLabel("CO CHCESZ ODEBRAĆ:").setPlaceholder("np. 20k$, elytra").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("reason").setLabel("ZA CO CHCESZ ODEBRAĆ:").setPlaceholder("np. konkurs, zaproszenia, drop").setStyle(TextInputStyle.Short).setRequired(true))
      );
    }

    if (interaction.customId === "sprzedaz") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server").setLabel("NA JAKIM SERWERZE:").setPlaceholder("np. anarchia.gg lf").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("item").setLabel("CO CHCESZ SPRZEDAĆ:").setPlaceholder("np. elytrę, 100k$").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("price").setLabel("ZA ILE CHCESZ SPRZEDAĆ:").setPlaceholder("np. 10 PLN").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("method").setLabel("JAKĄ METODĘ PŁATNOŚCI CHCESZ OTRZYMAĆ:").setPlaceholder("np. BLIK").setStyle(TextInputStyle.Short).setRequired(true))
      );
    }

    if (interaction.customId === "wymiana") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("from").setLabel("Z JAKIEGO SERWERA:").setPlaceholder("np. anarchia.gg lf").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("to").setLabel("NA JAKI SERWER:").setPlaceholder("np. anarchia.gg box").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("give").setLabel("CO CHCESZ WYMIENIĆ:").setPlaceholder("np. elytrę").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("get").setLabel("CO CHCESZ OTRZYMAĆ:").setPlaceholder("np. 100k$").setStyle(TextInputStyle.Short).setRequired(true))
      );
    }

    if (interaction.customId === "inne") {
      modale.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("desc").setLabel("W JAKIEJ SPRAWIE ROBISZ TICKETA:").setPlaceholder("Opisz swoją sprawę...").setStyle(TextInputStyle.Paragraph).setRequired(true))
      );
    }

    await interaction.showModal(modale);
  }

  // --- Tworzenie ticketa po wysłaniu modala ---
  if (interaction.isModalSubmit()) {
    const type = interaction.customId.replace("modal_", "");
    const guild = interaction.guild;
    const user = interaction.user;

    const categories = {
      zakup: process.env.CATEGORY_ZAKUP,
      odbior: process.env.CATEGORY_ODBIOR,
      sprzedaz: process.env.CATEGORY_SPRZEDAZ,
      wymiana: process.env.CATEGORY_WYMIANA,
      inne: process.env.CATEGORY_INNE,
    };
    const categoryId = categories[type];

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
      .setTitle(`🎟️ Ticket – ${type.toUpperCase()}`)
      .setDescription(`Zgłoszenie od: ${user}`)
      .setColor("Yellow")
      .setTimestamp();

    const closeBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_ticket").setLabel("Zamknij").setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ embeds: [embed], components: [closeBtn] });
    await interaction.reply({ content: `✅ Ticket utworzony: ${ticketChannel}`, ephemeral: true });
  }

  // --- Zamknięcie ticketa ---
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    if (!interaction.member.roles.cache.has(process.env.SUPPORT_ROLE_ID))
      return interaction.reply({ content: "❌ Nie masz uprawnień do zamknięcia ticketa.", ephemeral: true });
    await interaction.channel.delete();
  }
});

client.login(process.env.TOKEN);
