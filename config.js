require("dotenv").config();

module.exports = {
  // Bot Configuration
  BOT_TOKEN:
    process.env.BOT_TOKEN || "7755445668:AAFlXqHZCiIH4bDFvuvEMvZFcP2K7C1H6Ac",

  // API Configuration
  YOUTUBE_API: "https://yt-dl.officialhectormanuel.workers.dev/",
  SOCIAL_MEDIA_API: "https://dev-priyanshi.onrender.com/api/alldl",
  
  // Local Telegram Bot API Server (for 2GB file uploads)
  // Set this to your Render deployment URL when ready
  // Format: https://your-telegram-api-server.onrender.com
  TELEGRAM_BOT_API_SERVER: process.env.TELEGRAM_BOT_API_SERVER || null,

  // Bot Info
  CREATOR: "Darrell Mucheri (Mr Frank)",
  BOT_NAME: "𝙃𝙚𝙘𝙩𝙞𝙘 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙚𝙧 𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠",

  // Developer Info
  DEVELOPER: {
    name: "Mr Frank",
    telegram: "t.me/mrfrankofc",
    github: "github.com/mrfr8nk",
    whatsapp: "+263719647303",
  },

  // Start Menu Image
  START_IMAGE: "https://dabby.vercel.app/hect.jpg",

  // Features
  AUTO_DELETE_TIMEOUT: 60000,

  // Loading Animation
  LOADING_FRAMES: ["⏳", "⌛", "⏳", "⌛"],

  // Supported Platforms
  PLATFORMS: {
    instagram: {
      name: "Instagram",
      icon: "📸",
      regex:
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|stories)\/[\w-]+/i,
    },
    facebook: {
      name: "Facebook",
      icon: "👍",
      regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(share\/v\/|watch\/|video\/|reel\/|[\w-]+\/video)[\w/?=&\-._~:@!$'()*+,;%]+/i,
    },
    tiktok: {
      name: "TikTok",
      icon: "🎵",
      regex: /(?:https?:\/\/)?(?:www\.)?(?:vm\.)?tiktok\.com\/[\w@]+/i,
    },
    youtube: {
      name: "YouTube",
      icon: "🎬",
      regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+/i,
    },
  },

  // Messages
  WELCOME_MESSAGE: `╭════════════════⟢
│  🎬 𝙃𝙚𝙘𝙩𝙞𝙘 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙚𝙧 🎬  
╰════════════════⟢

🌟 *Welcome to Hectic Downloader Pro!*

📥 *How to use:*
━━━━━━━━━━━━━━━━━━━━
1️⃣ Send me a video link from:
   • 📸 Instagram (posts, reels, stories)
   • 👍 Facebook (videos)
   • 🎵 TikTok (videos)
   • 🎬 YouTube (videos)
2️⃣ Choose your preferred quality
3️⃣ Media sent directly to Telegram!

✨ *Features:*
━━━━━━━━━━━━━━━━━━━━
📸 Instagram posts, reels & stories
👍 Facebook videos
🎵 TikTok videos  
🎬 YouTube videos & search
⚡ Fast and reliable
🧹 Auto-cleanup messages

📱 *Commands:*
━━━━━━━━━━━━━━━━━━━━
/help - Show help menu
/developer - Developer contact
/uptime - Bot uptime status
/system - System information

\`\`\`𝘾𝙧𝙚𝙖𝙩𝙚𝙙 𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠\`\`\`

Send me a link to get started! 🚀`,

  HELP_MESSAGE: `╔═══════════════
║    📖 𝙃𝙚𝙡𝙥 𝙈𝙚𝙣𝙪    
╚════════════════════

*Available Commands:*
━━━━━━━━━━━━━━━━━━━━
/start - Start the bot
/help - Show this help message
/developer - Developer contact info
/uptime - Check bot uptime
/system - System information

*Supported Platforms:*
━━━━━━━━━━━━━━━━━━━━
📸 Instagram - posts, reels, stories
👍 Facebook - video posts
🎵 TikTok - video content
🎬 YouTube - videos & search

*How to download:*
━━━━━━━━━━━━━━━━━━━━
1️⃣ Send a video link or search query
2️⃣ If searching, choose from results
3️⃣ Select your preferred quality
4️⃣ Media sent directly to Telegram!

⚠️ *Note:* Messages auto-delete after 60 seconds!

👨‍💻 *Created by:* 𝙼𝚛 𝙵𝚛𝚊𝚗𝚔`,
};
