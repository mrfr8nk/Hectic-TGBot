require('dotenv').config();

module.exports = {
  // Bot Configuration
  BOT_TOKEN: process.env.BOT_TOKEN || '8579217430:AAEcglCDYIrH9nqb-aBuz5A9Q_HjuXKAGUQ',
  
  // API Configuration
  API_URL: 'https://yt-dl.officialhectormanuel.workers.dev/',
  
  // Bot Info
  CREATOR: 'Darrell Mucheri (Mr Frank)',
  BOT_NAME: 'HECTIC DOWNLOADER BOT',
  
  // Features
  AUTO_DELETE_TIMEOUT: 60000, // 60 seconds
  SEARCH_RESULTS_LIMIT: 10,
  
  // Loading Animation
  LOADING_FRAMES: ['⏳', '⌛', '⏳', '⌛'],
  
  // Messages
  WELCOME_MESSAGE: `🎬 *HECTIC DOWNLOADER BOT* 🎬

Welcome to the fastest YouTube downloader!

📥 *How to use:*
1. Send me a YouTube link OR search query
2. If searching, reply with the number (1-10)
3. Choose your preferred quality
4. Download instantly!

✨ *Features:*
• YouTube search with top 10 results
• Multiple video qualities (144p - 1080p)
• Audio-only downloads (MP3)
• Fast and reliable
• Auto-cleanup messages

👨‍💻 *Created by:* Darrell Mucheri (Mr Frank)

Send me a YouTube link or search query to get started! 🚀`,

  HELP_MESSAGE: `📖 *HECTIC DOWNLOADER BOT - Help*

*Commands:*
/start - Start the bot
/help - Show this help message

*How to download:*
1. Send a YouTube URL or search query
2. If searching, choose from top 10 results
3. Select your preferred quality
4. Click 'Download Now' to get your file

*Supported formats:*
🎵 Audio: MP3
📹 Video: 144p, 240p, 360p, 480p, 720p, 1080p

*Note:* Messages auto-delete after 60 seconds!

👨‍💻 *Created by:* Darrell Mucheri (Mr Frank)`
};
