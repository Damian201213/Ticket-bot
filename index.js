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
} from "discord.js";
import { REST } from "@discordjs/rest";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// ======= REJESTRACJA KOMENDY /ticket setup ======= //
const commands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Panel ticketów")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Wysyła panel ticketów na wybrany kanał")
    ),
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Komenda /ticket zarejestrowana");
  } catch (err) {
    console.error(err);
  }
})();

// ======= HANDLER INTERAKCJI ======= //
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (
      interaction.commandName === "ticket" &&
      interaction.options.getSubcommand() === "setup"
    ) {
      const select = new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("📩 Wybierz kategorię zgłoszenia")
        .addOptions([
          {
            label: "💰 Zakup",
            description: "Chcesz coś kupić?",
            value: "zakup",
          },
          {
            label: "📦 Odbiór",
            description: "Chcesz odebrać swoją nagrodę?",
            value: "odbior",
          },
          {
            label: "💸 Sprzedaż",
            description: "Chcesz coś sprzedać?",
            value: "sprzedaz",
          },
          {
            label: "🔁 Wymiana",
            description: "Chcesz się wymienić?",
            value: "wymiana",
          },
          {
            label: "❓ Inne",
            description: "Masz inną sprawę?",
            value: "inne",
          },
        ]);

      const row = new ActionRowBuilder().addComponents(select);
      const embed = new EmbedBuilder()
        .setTitle("🎟️ System Ticketów")
        .setDescription(
          "Wybierz kategorię, która najlepiej opisuje Twoją sprawę.\n\n> 💰 **Zakup** – chcesz coś kupić?\n> 💸 **Sprzedaż** – chcesz coś sprzedać?\n> 📦 **Odbiór** – chcesz odebrać nagrodę?\n> 🔁 **Wymiana** – chcesz się wymienić?\n> ❓ **Inne** – inne zapytania."
        )
        .setColor("Yellow");

      await interaction.reply({
        content: "✅ Panel ticketów wysłany!",
        ephemeral: true,
      });
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }
  }

  // ======= MENU WYBORU ======= //
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {
    const option = interaction.values[0];
    const modal = new ModalBuilder()
      .setCustomId(`modal_${option}`)
      .setTitle(`📩 Formularz: ${option.toUpperCase()}`);

    // --- Zakup ---
    if (option === "zakup") {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("server")
            .setLabel("Na jakim serwerze:")
            .setPlaceholder("np. anarchia.gg lf")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("item")
            .setLabel("Co chcesz kupić:")
            .setPlaceholder("np. 100k$, elytra")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("price")
            .setLabel("Za ile chcesz kupić:")
            .setPlaceholder("np. 10 PLN")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("payment")
            .setLabel("Jaką metodą płacisz:")
            .setPlaceholder("np. BLIK, PaySafeCard")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    }

    // --- Odbiór ---
    if (option === "odbior") {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("server")
            .setLabel("Na jakim serwerze:")
            .setPlaceholder("np. anarchia.gg lf")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("item")
            .setLabel("Co chcesz odebrać:")
            .setPlaceholder("np. 20k$, klucz dropu")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Za co chcesz odebrać:")
            .setPlaceholder("np. konkurs, drop, zaproszenia")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    }

    // --- Sprzedaż ---
    if (option === "sprzedaz") {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("server")
            .setLabel("Na jakim serwerze:")
            .setPlaceholder("np. anarchia.gg lf")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("item")
            .setLabel("Co chcesz sprzedać:")
            .setPlaceholder("np. 100k$, elytra")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("price")
            .setLabel("Za ile chcesz sprzedać:")
            .setPlaceholder("np. 10 PLN")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("payment")
            .setLabel("Jaką metodę płatności chcesz otrzymać:")
            .setPlaceholder("np. BLIK, PayPal")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    }

    // --- Wymiana ---
    if (option === "wymiana") {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("from")
            .setLabel("Z jakiego serwera:")
            .setPlaceholder("np. anarchia.gg lf")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("to")
            .setLabel("Na jaki serwer:")
            .setPlaceholder("np. anarchia.gg box")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("give")
            .setLabel("Co chcesz wymienić:")
            .setPlaceholder("np. elytrę")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("get")
            .setLabel("Co chcesz otrzymać:")
            .setPlaceholder("np. 100k$")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    }

    // --- Inne ---
    if (option === "inne") {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("desc")
            .setLabel("W jakiej sprawie robisz ticket:")
            .setPlaceholder("Opisz swoją sprawę...")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );
    }

    await interaction.showModal(modal);
  }

  // ======= MODALE ======= //
  if (interaction.isModalSubmit()) {
    const type = interaction.customId.split("_")[1];
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
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: process.env.SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎟️ ${type.toUpperCase()} | ${user.username}`)
      .setColor("Yellow")
      .setDescription("**Dane klienta:** " + user.toString())
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_ticket").setLabel("Zamknij").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("settings_ticket").setLabel("Ustawienia").setStyle(ButtonStyle.Secondary)
    );

    await ticketChannel.send({ embeds: [embed], components: [buttons] });
    await interaction.reply({ content: `✅ Ticket utworzony: ${ticketChannel}`, ephemeral: true });
  }
});

// ======= START ======= //
client.login(process.env.TOKEN);
