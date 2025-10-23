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
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes,
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

// ===================== CLIENT =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// ===================== REJESTRACJA KOMEND =====================
const commands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("System ticketów")
    .addSubcommand((sub) => sub.setName("setup").setDescription("Wysyła panel ticketów")),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log("🔁 Rejestrowanie komend...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("✅ Komendy zarejestrowane.");
  } catch (err) {
    console.error(err);
  }
})();

// ===================== INTERAKCJE =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit() && !interaction.isButton()) return;

  // ====== /ticket setup ======
  if (interaction.isChatInputCommand() && interaction.commandName === "ticket" && interaction.options.getSubcommand() === "setup") {
    const embed = new EmbedBuilder()
      .setTitle("💰 Kup Itemy × UTWÓRZ ZGŁOSZENIE")
      .setDescription(
        "**WAŻNE INFORMACJE**\n" +
          "• Otwieranie ticketów bez powodu jest zabronione,\n" +
          "• Administracja odpowiada w przeciągu 24h,\n" +
          "• Minimalna kwota zamówienia wynosi **10 PLN**, \n" +
          "• Prowizja dla płatności **PaySafeCard wynosi 10%**.\n\n" +
          "📩 **Wybierz odpowiednią kategorię, aby utworzyć zgłoszenie!**"
      )
      .setColor("Yellow")
      .setImage("https://i.imgur.com/qVQQ4CJ.png") // możesz tu dać własny banner
      .setFooter({ text: "Kup Itemy - System Ticketów" });

    const select = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("Nie wybrałeś/aś żadnej kategorii.")
        .addOptions([
          { label: "Zakup", description: "Kliknij, aby zakupić przedmioty.", value: "zakup", emoji: "🛒" },
          { label: "Odbiór", description: "Kliknij, aby odebrać nagrodę.", value: "odbior", emoji: "🎁" },
          { label: "Sprzedaż", description: "Kliknij, aby sprzedać przedmioty.", value: "sprzedaz", emoji: "💸" },
          { label: "Wymiana", description: "Kliknij, aby wymienić przedmioty.", value: "wymiana", emoji: "🔁" },
          { label: "Inne", description: "Kliknij, jeśli masz inną sprawę.", value: "inne", emoji: "❔" },
        ])
    );

    await interaction.reply({ content: "✅ Panel ticketów został wysłany!", ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [select] });
  }

  // ====== OBSŁUGA MENU (formularze) ======
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {
    const option = interaction.values[0];
    const modal = new ModalBuilder().setTitle("Kup Itemy").setCustomId(`modal_${option}`);

    const input = (id, label, placeholder) =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId(id).setLabel(label).setPlaceholder(placeholder).setStyle(TextInputStyle.Short).setRequired(true)
      );

    switch (option) {
      case "zakup":
        modal.addComponents(
          input("server", "NA JAKIM SERWERZE:", "np. anarchia.gg lf"),
          input("item", "CO CHCESZ KUPIĆ:", "np. 100k$, elytra"),
          input("price", "ZA ILE CHCESZ KUPIĆ:", "np. 10 PLN"),
          input("payment", "JAKĄ METODĄ PŁATNOŚCI PŁACISZ:", "np. BLIK, PSC")
        );
        break;

      case "odbior":
        modal.addComponents(
          input("server", "NA JAKIM SERWERZE:", "np. anarchia.gg lf"),
          input("item", "CO CHCESZ ODEBRAĆ:", "np. 20k$"),
          input("reason", "ZA CO CHCESZ ODEBRAĆ:", "np. konkurs, zaproszenia")
        );
        break;

      case "sprzedaz":
        modal.addComponents(
          input("server", "NA JAKIM SERWERZE:", "np. anarchia.gg lf"),
          input("item", "CO CHCESZ SPRZEDAĆ:", "np. 100k$, elytra"),
          input("price", "ZA ILE CHCESZ SPRZEDAĆ:", "np. 10 PLN"),
          input("payment", "JAKĄ METODĘ PŁATNOŚCI CHCESZ OTRZYMAĆ:", "np. BLIK")
        );
        break;

      case "wymiana":
        modal.addComponents(
          input("from", "Z JAKIEGO SERWERA:", "np. anarchia.gg lf"),
          input("to", "NA JAKI SERWER:", "np. anarchia.gg box"),
          input("give", "CO CHCESZ WYMIENIĆ:", "np. elytrę"),
          input("get", "CO CHCESZ OTRZYMAĆ:", "np. 100k$")
        );
        break;

      case "inne":
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("desc")
              .setLabel("W JAKIEJ SPRAWIE ROBISZ TICKETA:")
              .setPlaceholder("Opisz swoją sprawę...")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );
        break;
    }

    await interaction.showModal(modal);
  }

  // ====== MODALE (tworzenie ticketów) ======
  if (interaction.isModalSubmit()) {
    const type = interaction.customId.split("_")[1];
    const user = interaction.user;
    const guild = interaction.guild;
    const categories = {
      zakup: process.env.CATEGORY_ZAKUP,
      odbior: process.env.CATEGORY_ODBIOR,
      sprzedaz: process.env.CATEGORY_SPRZEDAZ,
      wymiana: process.env.CATEGORY_WYMIANA,
      inne: process.env.CATEGORY_INNE,
    };
    const parent = categories[type];

    const channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: 0,
      parent,
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

    await channel.send({ embeds: [embed], components: [buttons] });
    await interaction.reply({ content: `✅ Ticket utworzony: ${channel}`, ephemeral: true });
  }

  // ====== PRZYCISKI (Zamknij / Ustawienia) ======
  if (interaction.isButton()) {
    const member = interaction.member;

    // Zamknięcie
    if (interaction.customId === "close_ticket") {
      if (!member.roles.cache.has(process.env.SUPPORT_ROLE_ID))
        return interaction.reply({ content: "❌ Nie masz uprawnień do zamknięcia ticketa.", ephemeral: true });
      await interaction.channel.delete();
    }

    // Ustawienia
    if (interaction.customId === "settings_ticket") {
      if (!member.roles.cache.has(process.env.SUPPORT_ROLE_ID))
        return interaction.reply({ content: "❌ Tylko support może używać tego przycisku.", ephemeral: true });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("call_user").setLabel("Wezwij użytkownika").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("takeover_ticket").setLabel("Przejmij").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("rename_ticket").setLabel("Edytuj nazwę").setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ content: "⚙️ Panel ustawień ticketa:", components: [row], ephemeral: true });
    }

    // Wezwij użytkownika
    if (interaction.customId === "call_user") {
      const perms = interaction.channel.permissionOverwrites.cache.find((po) => po.allow.has(PermissionFlagsBits.ViewChannel) && po.type === 1);
      if (!perms) return interaction.reply({ content: "Nie znaleziono użytkownika ticketa.", ephemeral: true });

      const user = await client.users.fetch(perms.id);
      await user.send(`📩 Jesteś wzywany na ticketa: ${interaction.channel.name} (ID: ${interaction.channel.id})`);
      await interaction.reply({ content: `✅ Wezwano ${user}.`, ephemeral: true });
    }

    // Przejmij
    if (interaction.customId === "takeover_ticket") {
      await interaction.reply({ content: `👑 ${interaction.user} przejął tego ticketa.`, ephemeral: false });
    }

    // Edytuj nazwę
    if (interaction.customId === "rename_ticket") {
      await interaction.reply({ content: "✏️ Podaj nową nazwę kanału (30s):", ephemeral: true });
      const filter = (m) => m.author.id === interaction.user.id;
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });
      if (collected.size) {
        const name = collected.first().content;
        await interaction.channel.setName(name);
        await interaction.followUp({ content: `✅ Nazwa zmieniona na **${name}**`, ephemeral: true });
      } else await interaction.followUp({ content: "⏰ Czas minął.", ephemeral: true });
    }
  }
});

// ===================== START =====================
client.login(process.env.TOKEN);
