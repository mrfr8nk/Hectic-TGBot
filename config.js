require('dotenv').config();

module.exports = {
  // Bot Configuration
  BOT_TOKEN: process.env.BOT_TOKEN || 'your_telegram_bot_token_here',
  
  // API Configuration
  API_URL: 'https://dev-priyanshi.onrender.com/api/alldl',
  
  // Bot Info
  CREATOR: 'Priyanshi Kaur',
  BOT_NAME: '𝙋𝙧𝙤 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙚𝙧 𝘽𝙤𝙩',
  
  // Developer Info
  DEVELOPER: {
    name: 'Priyanshi Kaur',
    facebook: 'https://www.facebook.com/PriyanshiKaurJi',
    telegram: 'PriyanshiKaur'
  },
  
  // Start Menu Image
  START_IMAGE: 'https://i.postimg.cc/CLsvy8vL/Nayan-Not-Available.jpg',
  
  // Features
  AUTO_DELETE_TIMEOUT: 60000,
  
  // Loading Animation
  LOADING_FRAMES: ['⏳', '⌛', '⏳', '⌛'],
  
  // Supported Platforms
  PLATFORMS: {
    instagram: { name: 'Instagram', icon: '📸', regex: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|stories)\/[\w-]+/i },
    facebook: { name: 'Facebook', icon: '👍', regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/\S+\/video\S*/i },
    tiktok: { name: 'TikTok', icon: '🎵', regex: /(?:https?:\/\/)?(?:www\.)?(?:vm\.)?tiktok\.com\/[\w@]+/i },
    youtube: { name: 'YouTube', icon: '🎬', regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+/i }
  },
  
  // Messages
  WELCOME_MESSAGE: `╭════════════════⟢
│  🎬 𝙋𝙧𝙖𝙣 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙚𝙧 🎬  
╰════════════════⟢

🌟 *Welcome to the Pro Downloader Bot!*

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

\`\`\`𝘾𝙧𝙚𝙖𝙩𝙚𝙙 𝙱𝙮 𝙋𝙞𝙖𝙮𝙖𝙣𝙨𝙝𝙞 𝙆𝙖𝙪𝙧\`\`\`

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

👨‍💻 *Created by:* 𝙿𝚛𝚒𝚢𝚊𝚗𝚜𝚑𝚒 𝙺𝚊𝚞𝚛`
};
