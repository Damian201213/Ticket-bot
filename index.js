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
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// ===== PANEL TICKETÓW ===== //
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ===== MENU KATEGORII ===== //
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {
    const option = interaction.values[0];
    const modal = new ModalBuilder().setTitle("Kup Itemy").setCustomId(`modal_${option}`);

    if (option === "zakup") {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server").setLabel("NA JAKIM SERWERZE:").setPlaceholder("Przykład: anarchia.gg lf").setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("item").setLabel("CO CHCESZ KUPIĆ:").setPlaceholder("Przykład: 100k$, elytra").setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("price").setLabel("ZA ILE CHCESZ KUPIĆ:").setPlaceholder("Przykład: 10 PLN").setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("payment").setLabel("JAKĄ METODĄ PŁATNOŚCI PŁACISZ:").setPlaceholder("Przykład: BLIK, PaySafeCard").setStyle(TextInputStyle.Short).setRequired(true)
        )
      );
    }

    if (option === "inne") {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("desc").setLabel("W JAKIEJ SPRAWIE ROBISZ TICKETA:").setPlaceholder("Opisz swoją sprawę...").setStyle(TextInputStyle.Paragraph).setRequired(true)
        )
      );
    }

    await interaction.showModal(modal);
  }

  // ===== MODALE (tworzenie ticketa) ===== //
  if (interaction.isModalSubmit()) {
    const type = interaction.customId.split("_")[1];
    const categories = {
      zakup: process.env.CATEGORY_ZAKUP,
      inne: process.env.CATEGORY_INNE,
    };
    const categoryId = categories[type];
    const guild = interaction.guild;
    const user = interaction.user;

    const channel = await guild.channels.create({
      name: `${type}-${user.username}`,
      type: 0,
      parent: categoryId,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: process.env.SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 ${type.toUpperCase()} | ${user.username}`)
      .addFields(
        { name: "👤 Klient", value: `${user}`, inline: true },
        ...(type === "zakup"
          ? [
              { name: "🌐 Serwer", value: interaction.fields.getTextInputValue("server"), inline: true },
              { name: "🪙 Item", value: interaction.fields.getTextInputValue("item"), inline: true },
              { name: "💵 Cena", value: interaction.fields.getTextInputValue("price"), inline: true },
              { name: "💳 Płatność", value: interaction.fields.getTextInputValue("payment"), inline: true },
            ]
          : [{ name: "📜 Sprawa", value: interaction.fields.getTextInputValue("desc") }])
      )
      .setColor("Gold")
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_ticket").setLabel("Zamknij").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("settings_ticket").setLabel("Ustawienia").setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ embeds: [embed], components: [buttons] });
    await interaction.reply({ content: `✅ Ticket utworzony: ${channel}`, ephemeral: true });
  }

  // ===== PRZYCISKI ===== //
  if (interaction.isButton()) {
    if (interaction.customId === "close_ticket") {
      if (!interaction.member.roles.cache.has(process.env.SUPPORT_ROLE_ID))
        return interaction.reply({ content: "❌ Nie masz uprawnień do zamknięcia ticketa.", ephemeral: true });

      await interaction.channel.delete();
    }

    if (interaction.customId === "settings_ticket") {
      if (!interaction.member.roles.cache.has(process.env.SUPPORT_ROLE_ID))
        return interaction.reply({ content: "❌ Nie masz dostępu do ustawień.", ephemeral: true });

      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_settings_menu")
        .setPlaceholder("⚙️ Wybierz akcję...")
        .addOptions([
          { label: "📣 Wezwij użytkownika", description: "Powiadom właściciela ticketa", value: "call_user" },
          { label: "📌 Przypnij wiadomość", description: "Przypnij główny embed", value: "pin" },
          { label: "✏️ Zmień nazwę", description: "Zmień nazwę ticketa", value: "rename_ticket" },
          { label: "🔒 Zamknij ticketa", description: "Usuń kanał ticketa", value: "delete_ticket" },
        ]);

      const row = new ActionRowBuilder().addComponents(menu);
      await interaction.reply({ content: "⚙️ Panel ustawień ticketa:", components: [row], ephemeral: true });
    }
  }

  // ===== MENU USTAWIEŃ ===== //
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_settings_menu") {
    const action = interaction.values[0];
    const user = interaction.user;
    const channel = interaction.channel;

    if (action === "call_user") {
      const target = channel.permissionOverwrites.cache.find((po) => po.allow.has(PermissionFlagsBits.ViewChannel) && po.type === 1)?.id;
      if (!target) return interaction.reply({ content: "❌ Nie znaleziono właściciela ticketa.", ephemeral: true });

      const targetUser = await client.users.fetch(target);
      await targetUser.send(`📩 Zostałeś wezwany do swojego ticketa: ${channel.name}`);
      await interaction.reply({ content: `✅ Użytkownik ${targetUser} został powiadomiony.`, ephemeral: true });
    }

    if (action === "pin") {
      const messages = await channel.messages.fetch({ limit: 1 });
      const lastMessage = messages.first();
      if (lastMessage) {
        await lastMessage.pin();
        await interaction.reply({ content: "📌 Wiadomość przypięta!", ephemeral: true });
      }
    }

    if (action === "rename_ticket") {
      await interaction.reply({ content: "✏️ Napisz nową nazwę w ciągu 30 sekund:", ephemeral: true });

      const filter = (m) => m.author.id === user.id;
      const collected = await channel.awaitMessages({ filter, max: 1, time: 30000 });
      if (collected.size > 0) {
        const newName = collected.first().content;
        await channel.setName(newName);
        await interaction.followUp({ content: `✅ Nazwa zmieniona na **${newName}**`, ephemeral: true });
      } else {
        await interaction.followUp({ content: "⏰ Minął czas na odpowiedź.", ephemeral: true });
      }
    }

    if (action === "delete_ticket") {
      await interaction.reply({ content: "🔒 Ticket zostanie zamknięty za 3 sekundy...", ephemeral: true });
      setTimeout(() => channel.delete(), 3000);
    }
  }
});

// ===== START BOTA ===== //
client.login(process.env.TOKEN);
