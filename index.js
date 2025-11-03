// === DonutOne Main Bot ===
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionsBitField,
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TOKEN = process.env.BOT_TOKEN;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ===============================
// 1️⃣ Rejestracja komendy /clear
// ===============================
const commands = [
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("🧹 Delete a specific number of messages from the channel.")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("How many messages to delete (1–100)")
        .setRequired(true)
    ),
].map((cmd) => cmd.toJSON());

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
// 2️⃣ Event: powitanie nowego użytkownika
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
// 3️⃣ Event: obsługa /clear
// ===============================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "clear") {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
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

    const deleted = await interaction.channel
      .bulkDelete(amount, true)
      .catch((err) => {
        console.error(err);
        return null;
      });

    if (!deleted) {
      return await interaction.reply({
        content: "❌ Couldn’t delete messages. They may be older than 14 days.",
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
// 4️⃣ Komenda !calc
// ===============================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!calc") return;

  const embed = new EmbedBuilder()
    .setColor("#ff66cc")
    .setTitle("🧮 What do you want to calculate?")
    .setDescription(
      "Type `1` for: profit per bone <:bone:1323136132833218601>\n" +
        "Type `2` for: spawners to bones/min <:mob_spawner:1323136997388320810>\n" +
        "Type `3` for: pickles to money <:sea_pickles:1323135877651628103>\n" +
        "Type `4` for: farm to money per hour <:diamond:1323137208739434557>\n" +
        "Type `5` for: bone storage duration <:minecraft_clock:1323136404649410677>\n" +
        "Type `6` for: modules to spawners conversion 🔄\n" +
        "Type `7` for: bamboo farm to money per hour <:minecraft_bamboo:1357200561199644673>\n\n" +
        "Please __reply to this message__ with your choice!"
    )
    .setFooter({ text: "DonutSMP Calculator | !calc" });

  const sent = await message.channel.send({ embeds: [embed] });

  const filter = (m) => m.author.id === message.author.id;
  try {
    const collected = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 60000,
      errors: ["time"],
    });

    const choice = collected.first().content.trim();

    switch (choice) {
      case "1":
        message.reply("🦴 Option 1: profit per bone – coming soon!");
        break;
      case "2":
        message.reply("💀 Option 2: spawners to bones/min – coming soon!");
        break;
      case "3":
        message.reply("🥒 Option 3: pickles to money – coming soon!");
        break;
      case "4":
        message.reply("💎 Option 4: farm to money per hour – coming soon!");
        break;
      case "5":
        message.reply("⏰ Option 5: bone storage duration – coming soon!");
        break;
      case "6":
        message.reply("🔄 Option 6: modules to spawners conversion – coming soon!");
        break;
      case "7":
        message.reply("🎋 Option 7: bamboo farm to money per hour – coming soon!");
        break;
      default:
        message.reply("❌ Please reply with a number between 1 and 7.");
        break;
    }
  } catch (err) {
    message.reply("⏰ You didn’t reply in time. Please try again!");
  }
});

// ===============================
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
