// === bot.js ===
const { 
  Client, 
  GatewayIntentBits, 
  Partials,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
require('dotenv').config();

// === KONFIGURACJA KLIENTA ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// === ZMIENNE ŚRODOWISKOWE ===
const TOKEN = process.env.TOKEN || process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const CLEAR_CHANNEL_ID = process.env.CLEAR_CHANNEL_ID;


// ===============================
// 📜 Tekst zasad (poprawny zapis)
// ===============================
const RULES_TEXT = `
**1️⃣ Be Respectful**
Treat all members with kindness and respect. No bullying, harassment, hate speech, or personal attacks.  
💡 *This rule sets the tone for a positive and welcoming environment. It prevents toxic behavior that could drive people away.*

**2️⃣ No Spamming or Flooding**
Do not spam messages, images, or links. Avoid flooding the chat with excessive messages.  
💡 *Spamming disrupts conversations and makes it difficult for others to engage in meaningful discussions.*

**3️⃣ No NSFW Content**
No explicit, sexually suggestive, or inappropriate content in any channels unless the server specifically allows for it.  
💡 *This keeps the server safe for all ages and ensures a respectful space for everyone.*

**4️⃣ Follow Discord’s Terms of Service**
Always adhere to Discord’s Terms of Service and Community Guidelines.  
💡 *This is a non-negotiable rule that protects your server from being taken down by Discord for violations of its terms.*
`;

// ===============================
// 1️⃣ Rejestracja komendy /clear
// ===============================
const commands = [
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("🧹 Delete a specific number of messages from the channel.")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("How many messages to delete (1–100)")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔄 Registering slash commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("✅ Slash commands registered!");
  } catch (err) {
    console.error("❌ Error registering commands:", err);
  }
})();

// ===============================
// 2️⃣ Powitanie nowego użytkownika
// ===============================
client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return console.log("⚠️ Welcome channel not found!");

  const embed = new EmbedBuilder()
    .setColor("#ff69b4")
    .setTitle("🍩 DonutOne × WELCOME")
    .setDescription(
      `✨ Welcome **${member.user.username}** to **DonutOne**!\n\n` +
      `👥 You are member **#${member.guild.memberCount}** on our server!\n\n` +
      `🌟 We hope you’ll stay with us for a long time!`
    )
    .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 256 }))
    .setFooter({ text: `Joined at ${new Date().toLocaleString()}` })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
});
// ===============================
// 3️⃣ Obsługa komendy /clear
// ===============================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "clear") {
    // Tylko wybrany kanał
    if (interaction.channel.id !== CLEAR_CHANNEL_ID) {
      return await interaction.reply({
        content: "🚫 You can only use this command in the designated channel.",
        ephemeral: true,
      });
    }

    // Uprawnienia
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      return await interaction.reply({
        content: "🚫 You don’t have permission to use this command.",
        ephemeral: true,
      });
    }

    const amount = interaction.options.getInteger("amount");

    if (amount < 1 || amount > 100) {
      return await interaction.reply({
        content: "⚠️ Please provide a number between **1 and 100**.",
        ephemeral: true,
      });
    }

    // Usuwanie wiadomości
    const deleted = await interaction.channel
      .bulkDelete(amount, true)
      .catch((err) => {
        console.error(err);
        return null;
      });

    if (!deleted) {
      return await interaction.reply({
        content:
          "❌ Couldn’t delete messages. They may be older than 14 days.",
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: `✅ Deleted **${deleted.size}** messages.`,
      ephemeral: true,
    });
  }
});

// ===============================
// 4️⃣ Komendy !buy i !shop
// ===============================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // !buy
  if (message.content.toLowerCase() === "!buy") {
    const embed = new EmbedBuilder()
      .setColor("#ff69b4")
      .setTitle("🛒 How to Buy Something on DonutOne")
      .setDescription(
        "### 🛍️ How to buy something on [MY STORE](https://donutone/)\n\n" +
        "- First go to [My Store](https://donutone.mysellauth.com/), select the product that you want, and make sure it's in stock.\n" +
        "- When you select what you want, after clicking **'Buy Now'**, type your **email address**, connect your **Discord account**, and select **payment**.\n" +
        "- After you pay for the product, DM <@1427303659141595137> with your **IGN**.\n\n" +
        "🧾 Your order will appear here:\n" +
        "[Orders Channel](https://discord.com/channels/1434612759928115363/1434619237405823116)\n\n" +
        "💖 After you receive your product, please **vouch me** here:\n" +
        "[Vouch Channel](https://discord.com/channels/1434612759928115363/1434645795289960458)"
      )
      .setFooter({ text: "DonutOne Store • Thank you for supporting!" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }

   // !spawner
  if (message.content.toLowerCase() === "!spawner") {
    const embed = new EmbedBuilder()
      .setColor("#ffcc00")
      .setTitle("🕹️ Spawner Prices")
      .setDescription(
`**Buying:** (You Sell To Us)
> - Iron Golem Spawners **875k** each
> - Skeleton Spawners  **1.85m-2m** each
> - Zombified Pigman Spawners **500k** each
> - Blaze Spawners **350k** each
> - Creeper Spawners **400k** each
> - Zombie Spawners **250k** each
> - Spider Spawners **250k** each
> - Pig Spawners **150k** each
> - 🐮 Cow Spawners **150k** each

**Selling:** (We Sell To You)
> - Iron Golem Spawner **1.2m** each
> - Skeleton Spawners **2.4m** each
> - Pig Spawners **500k** each
> - 🐮 Cow Spawners **500k** each
> - Creeper Spawners **800k** each
__**WE ARE NOT SELLING ANY OTHER SPAWNER THATS NOT LISTED HERE!**__

To buy or sell make a <#1434615744703889602>
**10 spawners min**
- We are not going first but on huge number of spawners there is a little space to negotiate. (500+ Spawner)
<#1434615744703889602>`
      )
      .setFooter({ text: "DonutOne • Spawner Market" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
    // !role
  if (message.content.toLowerCase() === "!role") {
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("📜 DonutOne Server Rules")
      .setDescription(
`**5️⃣ No Advertising or Self-Promotion Without Permission**
Don’t advertise your own server, social media, or products without getting approval from admins first.  
💡 *Prevents spammy self-promotion and keeps chat clean.*

**6️⃣ Use Appropriate Channels**
Stay on-topic and use the correct channels for different conversations.  
💡 *Helps keep the server organized and easy to navigate.*

**7️⃣ No Personal Information**
Don’t share personal information, including addresses, phone numbers, or private details about yourself or others.  
💡 *Protects members' privacy and safety.*`
)

      .setFooter({ text: "DonutOne • Server Rules" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }

  // !shop
  if (message.content.toLowerCase() === "!shop") {
    const embed = new EmbedBuilder()
      .setColor("#00ff99")
      .setTitle("🛍️ Visit Our Store")
      .setDescription("[Click here to open the store](https://donutone.mysellauth.com/)")
      .setFooter({ text: "DonutOne Store • Fast & Secure" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
});

// ===============================
// 5️⃣ Logowanie bota
// ===============================
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});
// na końcu bot.js — tylko jeśli deployujesz jako Render Web Service
const http = require('http');

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});
// === /panel command ===
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  // ======== /panel command ========
  if (interaction.isChatInputCommand() && interaction.commandName === "panel") {
    const embed = new EmbedBuilder()
      .setColor("#00ffff")
      .setTitle(`🎫 Tickets are used to provide support to the community. please do not create a troll ticket or misuse it.
                 
                🎁 Giveaway Claim: Open a ticket if you want to claim things you won you only have 24 Hours to claim after the giveaway ended.

                🤝 Partnerships/support: Open a ticket if you need any kind of support with getting partnerships or for any questions you have.

                💸 Buy/Sell: Open a ticket if you want to sell us spawners or buy from us.`)
      .setDescription("🎫 | Select a category below to open a ticket.")
      .setImage("https://cdn.discordapp.com/attachments/1432012658693116028/1434959872184549648/file_00000000ce9c71f7806959b9a6389aae.png?ex=690c3445&is=690ae2c5&hm=53f170fa91be03b6e5809bd5aab72d863272e409b5559a5aa5410aa8a5a563b2&"); // <- możesz tu dodać swoje zdjęcie

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("Select ticket category")
      .addOptions([
        {
          label: "💸 Buy/Sell",
          description: "Open a ticket if you want to sell or buy something.",
          value: "buy_sell",
        },
        {
          label: "🎁 Giveaway Claim",
          description: "Open a ticket to claim your giveaway reward.",
          value: "giveaway",
        },
        {
          label: "👨‍💼 Sponsor Loot Drop",
          description: "Open a ticket if you want to sponsor a drop.",
          value: "sponsor",
        },
        {
          label: "📦 Pickup Item",
          description: "Open a ticket to pick up purchased items.",
          value: "pickup",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  }

  // ======== CATEGORY SELECT ========
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_select") {
    const value = interaction.values[0];
    let modal;

    // 💸 BUY/SELL FORM
    if (value === "buy_sell") {
      modal = new ModalBuilder()
        .setCustomId("modal_buy_sell")
        .setTitle("💸 Buy/Sell Ticket");

      const ign = new TextInputBuilder()
        .setCustomId("ign")
        .setLabel("Your Minecraft IGN")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const details = new TextInputBuilder()
        .setCustomId("details")
        .setLabel("What do you want to buy/sell?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
      
      const details = new TextInputBuilder()
        .setCustomId("spawner")
        .setLabel("what spawners")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(ign),
        new ActionRowBuilder().addComponents(details)
      );
    }

    // 🎁 GIVEAWAY CLAIM FORM
    if (value === "giveaway") {
      modal = new ModalBuilder()
        .setCustomId("modal_giveaway")
        .setTitle("🎁 Giveaway Claim");

      const ign = new TextInputBuilder()
        .setCustomId("ign")
        .setLabel("Your Minecraft IGN")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const prize = new TextInputBuilder()
        .setCustomId("prize")
        .setLabel("What did you win?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(ign),
        new ActionRowBuilder().addComponents(prize)
      );
    }

    // 👨‍💼 SPONSOR FORM
    if (value === "sponsor") {
      modal = new ModalBuilder()
        .setCustomId("modal_sponsor")
        .setTitle("👨‍💼 Sponsor Loot Drop");

      const ign = new TextInputBuilder()
        .setCustomId("ign")
        .setLabel("Your Minecraft IGN")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const offer = new TextInputBuilder()
        .setCustomId("offer")
        .setLabel("Which items would you like to give?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(ign),
        new ActionRowBuilder().addComponents(offer)
      );
    }

    // 📦 PICKUP ITEM FORM
    if (value === "pickup") {
      modal = new ModalBuilder()
        .setCustomId("modal_pickup")
        .setTitle("📦 Pickup Purchased Item");

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
  }

  // ======== FORM SUBMIT ========
  if (interaction.isModalSubmit()) {
    const user = interaction.user;
    let title, description;

    if (interaction.customId === "modal_buy_sell") {
      title = "💸 Buy/Sell Ticket";
      description = `**IGN:** ${interaction.fields.getTextInputValue("ign")}\n**Details:** ${interaction.fields.getTextInputValue("details")}`;
    }
    if (interaction.customId === "modal_giveaway") {
      title = "🎁 Giveaway Claim";
      description = `**IGN:** ${interaction.fields.getTextInputValue("ign")}\n**Prize:** ${interaction.fields.getTextInputValue("prize")}`;
    }
    if (interaction.customId === "modal_sponsor") {
      title = "👨‍💼 Sponsor Loot Drop";
      description = `**IGN:** ${interaction.fields.getTextInputValue("ign")}\n**Offer:** ${interaction.fields.getTextInputValue("offer")}`;
    }
    if (interaction.customId === "modal_pickup") {
      title = "📦 Pickup Purchased Item";
      description = `**IGN:** ${interaction.fields.getTextInputValue("ign")}\n**Item:** ${interaction.fields.getTextInputValue("item")}`;
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      parent: process.env.CATEGORY_ID || null,
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
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@${user.id}>`,
      embeds: [embed],
      components: [buttons],
    });

    await interaction.reply({
      content: `✅ Your ticket has been created: ${channel}`,
      ephemeral: true,
    });
  }

  // ======== CLOSE / DELETE ========
  if (interaction.isButton()) {
    if (interaction.customId === "close_ticket") {
      await interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: false });
      await interaction.reply({ content: "🔒 Ticket closed.", ephemeral: true });
    }

    if (interaction.customId === "delete_ticket") {
      await interaction.reply({ content: "🗑️ Deleting ticket...", ephemeral: true });
      setTimeout(() => interaction.channel.delete(), 3000);
    }
  }
});
// === START BOTA ===
client.once("ready", () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
});
server.listen(PORT, () => {
  console.log(`Health server listening on port ${PORT}`);
});
client.login(TOKEN);
