// === bot.js ===
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionsBitField
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

const TOKEN = process.env.BOT_TOKEN;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CLEAR_CHANNEL_ID = process.env.CLEAR_CHANNEL_ID;

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

client.login(TOKEN);
