// === welcome-bot.js ===
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
});

const TOKEN = process.env.BOT_TOKEN;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) {
    console.log("⚠️ Welcome channel not found!");
    return;
  }

  // Embed powitalny
  const embed = new EmbedBuilder()
    .setColor("#2ecc71")
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

client.login(TOKEN);
