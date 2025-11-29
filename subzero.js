const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const YoutubeSearch = require('youtube-search-api');
const config = require('./config');

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

const userStates = new Map();
const videoDataCache = new Map();

const botStartTime = Date.now();
const userList = new Set();

const trackUser = (userId) => {
  userList.add(userId);
};

// Detect platform from URL
const detectPlatform = (url) => {
  for (const [platform, data] of Object.entries(config.PLATFORMS)) {
    if (data.regex.test(url)) {
      return platform;
    }
  }
  return null;
};

// Extract video ID or get URL info
const extractVideoInfo = (url) => {
  const youtube_patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of youtube_patterns) {
    const match = url.match(pattern);
    if (match) return { id: match[1], url: `https://www.youtube.com/watch?v=${match[1]}` };
  }
  return { id: null, url: url };
};

const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Download from API
const downloadFromAPI = async (url) => {
  try {
    const response = await axios.get(config.API_URL, {
      params: { url: url },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading from API:', error.message);
    return null;
  }
};

// Search YouTube
const searchYouTube = async (query) => {
  try {
    const results = await YoutubeSearch.GetListByKeyword(query, false, 12);
    return results.items || [];
  } catch (error) {
    console.error('Error searching YouTube:', error.message);
    return [];
  }
};

const animateLoading = async (chatId, messageId, text = 'Processing') => {
  let frame = 0;
  const interval = setInterval(async () => {
    try {
      await bot.editMessageText(
        `${config.LOADING_FRAMES[frame]} ${text}...`,
        { chat_id: chatId, message_id: messageId }
      );
      frame = (frame + 1) % config.LOADING_FRAMES.length;
    } catch (error) {
      clearInterval(interval);
    }
  }, 500);
  
  return interval;
};

const scheduleDelete = async (chatId, messageIds, timeout = config.AUTO_DELETE_TIMEOUT) => {
  setTimeout(async () => {
    for (const msgId of messageIds) {
      try {
        await bot.deleteMessage(chatId, msgId);
      } catch (error) {
        // Message already deleted
      }
    }
  }, timeout);
};

const sendMediaToTelegram = async (chatId, downloadUrl, type, videoData) => {
  const progressMsg = await bot.sendMessage(chatId, `📥 *Processing...*\n\n${videoData.title || 'Media'}`, {
    parse_mode: 'Markdown'
  });
  
  try {
    // Attempt direct upload to Telegram (no file size limits enforced by bot)
    const response = await axios.get(downloadUrl, {
      responseType: 'stream',
      timeout: 300000 // Extended timeout for large files
    });
    
    await bot.editMessageText(
      `⬆️ *Uploading...*\n\n${videoData.title || 'Media'}`,
      {
        chat_id: chatId,
        message_id: progressMsg.message_id,
        parse_mode: 'Markdown'
      }
    ).catch(() => {});
    
    const caption = `📹 *${videoData.title || 'Media Download'}*\n\n👨‍💻 *${config.BOT_NAME}*`;
    
    if (type === 'audio') {
      await bot.sendAudio(chatId, response.data, {
        caption,
        parse_mode: 'Markdown',
        title: videoData.title || 'Audio'
      });
    } else {
      await bot.sendVideo(chatId, response.data, {
        caption,
        parse_mode: 'Markdown',
        supports_streaming: true
      });
    }
    
    await bot.deleteMessage(chatId, progressMsg.message_id);
    return true;
  } catch (error) {
    console.error('Error uploading:', error.message);
    // Send direct download link as fallback (no size limit)
    await bot.editMessageText(
      `📥 *Direct Download Link*\n\n*${videoData.title || 'Media'}*\n\n[Download Here](${downloadUrl})`,
      { 
        chat_id: chatId, 
        message_id: progressMsg.message_id,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }
    ).catch(() => {});
    return true;
  }
};

// Command Handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  trackUser(msg.from.id);
  
  try {
    await bot.sendPhoto(chatId, config.START_IMAGE, {
      caption: config.WELCOME_MESSAGE,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    await bot.sendMessage(chatId, config.WELCOME_MESSAGE, { parse_mode: 'Markdown' });
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  trackUser(msg.from.id);
  await bot.sendMessage(chatId, config.HELP_MESSAGE, { parse_mode: 'Markdown' });
});

bot.onText(/\/developer/, async (msg) => {
  const chatId = msg.chat.id;
  trackUser(msg.from.id);
  
  const devInfo = `╔═══════════════════════╗
║   👨‍💻 𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧 𝙄𝙣𝙛𝙤   ║
╚═══════════════════════╝

*Developer:* ${config.DEVELOPER.name}

📱 *Facebook:* ${config.DEVELOPER.facebook}
💬 *Telegram:* @${config.DEVELOPER.telegram}

Feel free to reach out for support or feedback!`;

  await bot.sendMessage(chatId, devInfo, { parse_mode: 'Markdown' });
});

bot.onText(/\/uptime/, async (msg) => {
  const chatId = msg.chat.id;
  trackUser(msg.from.id);
  
  const uptime = Date.now() - botStartTime;
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const uptimeStr = `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  
  const uptimeMsg = `╔═══════════════════════╗
║    ⏱️ 𝘽𝙤𝙩 𝙐𝙥𝙩𝙞𝙢𝙚    ║
╚═══════════════════════╝

🟢 *Status:* Online
⏰ *Uptime:* ${uptimeStr}
🚀 *Started:* ${new Date(botStartTime).toLocaleString()}

The bot is running smoothly!`;

  await bot.sendMessage(chatId, uptimeMsg, { parse_mode: 'Markdown' });
});

bot.onText(/\/system/, async (msg) => {
  const chatId = msg.chat.id;
  trackUser(msg.from.id);
  
  const memUsage = process.memoryUsage();
  const ramUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const ramTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const ramPercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);
  
  const start = Date.now();
  await bot.sendChatAction(chatId, 'typing');
  const ping = Date.now() - start;
  
  const uptime = Date.now() - botStartTime;
  const seconds = Math.floor(uptime / 1000);
  const hours = Math.floor(seconds / 3600);
  
  const systemMsg = `╔═══════════════════════╗
║   💻 𝙎𝙮𝙨𝙩𝙚𝙢 𝙄𝙣𝙛𝙤   ║
╚═══════════════════════╝

🖥️ *RAM Usage:* ${ramUsed} MB / ${ramTotal} MB (${ramPercent}%)
⚡ *Ping:* ${ping}ms
⏱️ *Uptime:* ${hours}h ${Math.floor((seconds % 3600) / 60)}m
👥 *Total Users:* ${userList.size}
⚙️ *Node Version:* ${process.version}
🌐 *Platform:* ${process.platform}

System running optimally! ✅`;

  await bot.sendMessage(chatId, systemMsg, { parse_mode: 'Markdown' });
});

// Handle messages
bot.on('message', async (msg) => {
  try {
    if (!msg.text || msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    trackUser(msg.from.id);
    
    const userState = userStates.get(chatId);
    if (userState && userState.awaitingSelection) {
      const selection = parseInt(text);
      
      if (isNaN(selection) || selection < 1 || selection > userState.results.length) {
        await bot.sendMessage(chatId, '❌ Invalid selection. Please reply with a number between 1 and ' + userState.results.length);
        return;
      }
      
      const selectedVideo = userState.results[selection - 1];
      const videoUrl = `https://www.youtube.com/watch?v=${selectedVideo.id}`;
      
      userStates.delete(chatId);
      await processVideoUrl(chatId, videoUrl, msg.message_id);
      return;
    }
    
    // Detect platform
    const platform = detectPlatform(text);
    
    if (platform && platform !== 'youtube') {
      // Instagram, Facebook, TikTok
      await processMediaUrl(chatId, text, msg.message_id, platform);
    } else if (platform === 'youtube') {
      // YouTube URL
      await processVideoUrl(chatId, text, msg.message_id);
    } else {
      // Treat as YouTube search
      await processSearch(chatId, text, msg.message_id);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again.');
  }
});

// Process social media URLs
const processMediaUrl = async (chatId, url, originalMsgId, platform) => {
  const loadingMsg = await bot.sendMessage(chatId, `⏳ Processing ${config.PLATFORMS[platform].name} video...`);
  const loadingInterval = animateLoading(chatId, loadingMsg.message_id, 'Downloading');
  
  const mediaData = await downloadFromAPI(url);
  clearInterval(loadingInterval);
  
  if (!mediaData || !mediaData.status || !mediaData.data) {
    await bot.editMessageText(
      `❌ *Error!*

Could not download from ${config.PLATFORMS[platform].name}. Please check:
• The URL is correct
• The content is public
• The link is valid`,
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      }
    );
    scheduleDelete(chatId, [loadingMsg.message_id, originalMsgId], 10000);
    return;
  }
  
  await bot.deleteMessage(chatId, loadingMsg.message_id);
  
  // Extract media URLs
  const videoUrls = {
    low: mediaData.data.low,
    high: mediaData.data.high
  };
  
  const cacheId = `${chatId}_${Date.now()}`;
  videoDataCache.set(cacheId, {
    title: mediaData.data.title || `${config.PLATFORMS[platform].name} Video`,
    thumbnail: mediaData.data.thumbnail,
    videos: videoUrls
  });
  
  setTimeout(() => videoDataCache.delete(cacheId), 300000);
  
  const caption = `${config.PLATFORMS[platform].icon} *${mediaData.data.title || 'Media'}*

✅ Video found! Choose your preferred quality:

👨‍💻 *${config.BOT_NAME}*`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: `📹 Low Quality`, callback_data: `video|low|${cacheId}` },
        { text: `📹 High Quality`, callback_data: `video|high|${cacheId}` }
      ],
      [{ text: '❌ Cancel', callback_data: 'cancel' }]
    ]
  };
  
  let selectionMsg;
  if (mediaData.data.thumbnail) {
    try {
      selectionMsg = await bot.sendPhoto(chatId, mediaData.data.thumbnail, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      selectionMsg = await bot.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    }
  } else {
    selectionMsg = await bot.sendMessage(chatId, caption, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  userStates.set(chatId, {
    messagesToDelete: [originalMsgId, selectionMsg.message_id]
  });
};

// Process YouTube URL
const processVideoUrl = async (chatId, url, originalMsgId) => {
  const loadingMsg = await bot.sendMessage(chatId, '⏳ Fetching YouTube video...');
  const loadingInterval = animateLoading(chatId, loadingMsg.message_id, 'Fetching');
  
  const mediaData = await downloadFromAPI(url);
  clearInterval(loadingInterval);
  
  if (!mediaData || !mediaData.status || !mediaData.data) {
    await bot.editMessageText(
      `❌ *Error!*

Could not fetch video information. Please check:
• The URL is correct
• The video is publicly available`,
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      }
    );
    scheduleDelete(chatId, [loadingMsg.message_id, originalMsgId], 10000);
    return;
  }
  
  await bot.deleteMessage(chatId, loadingMsg.message_id);
  
  const cacheId = `${chatId}_${Date.now()}`;
  videoDataCache.set(cacheId, {
    title: mediaData.data.title || 'YouTube Video',
    thumbnail: mediaData.data.thumbnail,
    videos: { high: mediaData.data.high, low: mediaData.data.low }
  });
  
  setTimeout(() => videoDataCache.delete(cacheId), 300000);
  
  const caption = `🎬 *${mediaData.data.title || 'Video'}*

✅ Video found! Choose your preferred quality:

👨‍💻 *${config.BOT_NAME}*`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: `📹 Low Quality`, callback_data: `video|low|${cacheId}` },
        { text: `📹 High Quality`, callback_data: `video|high|${cacheId}` }
      ],
      [{ text: '❌ Cancel', callback_data: 'cancel' }]
    ]
  };
  
  let selectionMsg;
  if (mediaData.data.thumbnail) {
    try {
      selectionMsg = await bot.sendPhoto(chatId, mediaData.data.thumbnail, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      selectionMsg = await bot.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    }
  } else {
    selectionMsg = await bot.sendMessage(chatId, caption, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  userStates.set(chatId, {
    messagesToDelete: [originalMsgId, selectionMsg.message_id]
  });
};

// Process YouTube search
const processSearch = async (chatId, query, originalMsgId) => {
  const loadingMsg = await bot.sendMessage(chatId, '⏳ Searching YouTube...');
  const loadingInterval = animateLoading(chatId, loadingMsg.message_id, 'Searching');
  
  const results = await searchYouTube(query);
  clearInterval(loadingInterval);
  
  if (!results || results.length === 0) {
    await bot.editMessageText(
      '❌ No results found. Try a different search query.',
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    scheduleDelete(chatId, [loadingMsg.message_id, originalMsgId], 10000);
    return;
  }
  
  await bot.deleteMessage(chatId, loadingMsg.message_id);
  
  let resultText = `🔍 *Search Results*\n`;
  resultText += `━━━━━━━━━━━━━━━━━━━\n`;
  resultText += `Query: _"${query}"_\n\n`;
  
  results.slice(0, 10).forEach((video, index) => {
    const duration = video.length?.simpleText || '⏱️ Live';
    resultText += `*${index + 1}.* ${video.title}\n`;
  });
  
  resultText += `\n━━━━━━━━━━━━━━━━━━━\n`;
  resultText += `💬 Reply with number (1-${Math.min(results.length, 10)})`;
  
  let searchMsg;
  const thumbnail = results[0]?.thumbnail?.thumbnails?.[0]?.url;
  
  if (thumbnail) {
    try {
      searchMsg = await bot.sendPhoto(chatId, thumbnail, {
        caption: resultText,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      searchMsg = await bot.sendMessage(chatId, resultText, {
        parse_mode: 'Markdown'
      });
    }
  } else {
    searchMsg = await bot.sendMessage(chatId, resultText, {
      parse_mode: 'Markdown'
    });
  }
  
  userStates.set(chatId, {
    awaitingSelection: true,
    results: results.slice(0, 10),
    messagesToDelete: [originalMsgId, searchMsg.message_id]
  });
  
  scheduleDelete(chatId, [originalMsgId, searchMsg.message_id]);
};

// Handle callbacks
bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    await bot.answerCallbackQuery(query.id);
    
    if (data === 'cancel') {
      await bot.editMessageText('❌ Download cancelled.', {
        chat_id: chatId,
        message_id: query.message.message_id
      });
      
      const userState = userStates.get(chatId);
      if (userState && userState.messagesToDelete) {
        scheduleDelete(chatId, [...userState.messagesToDelete, query.message.message_id], 3000);
      }
      userStates.delete(chatId);
      return;
    }
    
    const parts = data.split('|');
    const downloadType = parts[0];
    const quality = parts[1];
    const cacheId = parts[2];
    
    const mediaData = videoDataCache.get(cacheId);
    if (!mediaData) {
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Session expired. Please send the link again.',
        show_alert: true
      });
      return;
    }
    
    const downloadUrl = mediaData.videos[quality];
    
    try {
      await bot.deleteMessage(chatId, query.message.message_id);
    } catch (error) {
      console.error('Error deleting message:', error.message);
    }
    
    await sendMediaToTelegram(chatId, downloadUrl, 'video', mediaData);
    
    const userState = userStates.get(chatId);
    if (userState && userState.messagesToDelete) {
      scheduleDelete(chatId, userState.messagesToDelete, 5000);
    }
    userStates.delete(chatId);
  } catch (error) {
    console.error('Error in callback:', error);
    await bot.answerCallbackQuery(query.id, {
      text: '❌ An error occurred. Please try again.',
      show_alert: true
    });
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('🚀 𝙋𝙧𝙤 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙚𝙧 𝘽𝙤𝙩 is running...');
console.log('👨‍💻 Created by:', config.CREATOR);
console.log('📊 Bot started at:', new Date().toLocaleString());
