const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const YoutubeSearch = require('youtube-search-api');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const config = require('./config');

ffmpeg.setFfmpegPath(ffmpegStatic);

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

const userStates = new Map();
const videoDataCache = new Map();

const botStartTime = Date.now();
const userList = new Set();

const trackUser = (userId) => {
  userList.add(userId);
};

const detectPlatform = (url) => {
  for (const [platform, data] of Object.entries(config.PLATFORMS)) {
    if (data.regex.test(url)) {
      return platform;
    }
  }
  return null;
};

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
      } catch (error) {}
    }
  }, timeout);
};

// Convert MP4 to MP3
const convertToMP3 = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .on('error', (err) => reject(err))
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
};

const sendMediaToTelegram = async (chatId, downloadUrl, type, videoData) => {
  const progressMsg = await bot.sendMessage(chatId, `📥 *Preparing download...*\n\n${videoData.title || 'Media'}`, {
    parse_mode: 'Markdown'
  });
  
  try {
    const response = await axios.get(downloadUrl, {
      responseType: 'stream',
      timeout: 600000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    await bot.editMessageText(
      `⬆️ *Uploading to Telegram...*\n\n${videoData.title || 'Media'}\n\n(Large files may take time)`,
      {
        chat_id: chatId,
        message_id: progressMsg.message_id,
        parse_mode: 'Markdown'
      }
    ).catch(() => {});
    
    const caption = `📹 *${videoData.title || 'Media Download'}*\n\n👨‍💻 *${config.BOT_NAME}*`;
    
    if (type === 'mp3') {
      const tempDir = '/tmp';
      const tempMp4 = path.join(tempDir, `temp_${Date.now()}.mp4`);
      const tempMp3 = path.join(tempDir, `temp_${Date.now()}.mp3`);
      
      const writeStream = fs.createWriteStream(tempMp4);
      response.data.pipe(writeStream);
      
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      await convertToMP3(tempMp4, tempMp3);
      
      const mp3Stream = fs.createReadStream(tempMp3);
      await bot.sendAudio(chatId, mp3Stream, {
        caption,
        parse_mode: 'Markdown',
        title: videoData.title || 'Audio'
      });
      
      try {
        fs.unlinkSync(tempMp4);
        fs.unlinkSync(tempMp3);
      } catch (e) {}
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
    
    await bot.editMessageText(
      `❌ *Upload Failed*\n\nError: ${error.message}\n\nPlease try again.`,
      { 
        chat_id: chatId, 
        message_id: progressMsg.message_id,
        parse_mode: 'Markdown'
      }
    ).catch(() => {});
    return false;
  }
};

// YouTube API download
const downloadFromYouTubeAPI = async (url) => {
  try {
    const response = await axios.get(config.YOUTUBE_API, {
      params: { url: url },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading from YouTube API:', error.message);
    return null;
  }
};

// Social media API download
const downloadFromSocialMediaAPI = async (url) => {
  try {
    const response = await axios.get(config.SOCIAL_MEDIA_API, {
      params: { url: url },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading from Social Media API:', error.message);
    return null;
  }
};

// Create YouTube keyboard with multiple qualities + MP3
const createYouTubeKeyboard = (cacheId) => {
  return {
    inline_keyboard: [
      [{ text: '🎵 MP3 Audio', callback_data: `mp3|${cacheId}` }],
      [
        { text: '📹 1080p', callback_data: `yt_1080|${cacheId}` },
        { text: '📹 720p', callback_data: `yt_720|${cacheId}` }
      ],
      [
        { text: '📹 480p', callback_data: `yt_480|${cacheId}` },
        { text: '📹 360p', callback_data: `yt_360|${cacheId}` }
      ],
      [
        { text: '📹 240p', callback_data: `yt_240|${cacheId}` },
        { text: '📹 144p', callback_data: `yt_144|${cacheId}` }
      ],
      [{ text: '❌ Cancel', callback_data: 'cancel' }]
    ]
  };
};

// Create Social Media keyboard with MP4 only
const createSocialMediaKeyboard = (cacheId) => {
  return {
    inline_keyboard: [
      [
        { text: '🎵 MP3 Audio', callback_data: `mp3|${cacheId}` }
      ],
      [
        { text: '📹 MP4 High', callback_data: `mp4_high|${cacheId}` },
        { text: '📹 MP4 Low', callback_data: `mp4_low|${cacheId}` }
      ],
      [{ text: '❌ Cancel', callback_data: 'cancel' }]
    ]
  };
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

📱 *Telegram:* ${config.DEVELOPER.telegram}
💻 *GitHub:* ${config.DEVELOPER.github}
📞 *WhatsApp:* ${config.DEVELOPER.whatsapp}

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
    
    const platform = detectPlatform(text);
    
    if (platform === 'youtube') {
      await processVideoUrl(chatId, text, msg.message_id);
    } else if (platform) {
      await processSocialMediaUrl(chatId, text, msg.message_id, platform);
    } else {
      await processSearch(chatId, text, msg.message_id);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again.');
  }
});

// YouTube URL processing with multiple qualities
const processVideoUrl = async (chatId, url, originalMsgId) => {
  const loadingMsg = await bot.sendMessage(chatId, '⏳ Fetching YouTube video...');
  const loadingInterval = animateLoading(chatId, loadingMsg.message_id, 'Fetching');
  
  const videoData = await downloadFromYouTubeAPI(url);
  clearInterval(loadingInterval);
  
  if (!videoData || !videoData.status) {
    await bot.editMessageText(
      `❌ *Error!*\n\nCould not fetch video. Check URL and privacy settings.`,
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
  videoDataCache.set(cacheId, videoData);
  
  setTimeout(() => videoDataCache.delete(cacheId), 300000);
  
  const caption = `🎬 *YouTube Video*

📹 *${videoData.title || 'Video'}*

━━━━━━━━━━━━━━
✨ Select Quality:
━━━━━━━━━━━━━━`;
  
  let selectionMsg;
  if (videoData.thumbnail) {
    try {
      selectionMsg = await bot.sendPhoto(chatId, videoData.thumbnail, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: createYouTubeKeyboard(cacheId)
      });
    } catch (error) {
      selectionMsg = await bot.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: createYouTubeKeyboard(cacheId)
      });
    }
  } else {
    selectionMsg = await bot.sendMessage(chatId, caption, {
      parse_mode: 'Markdown',
      reply_markup: createYouTubeKeyboard(cacheId)
    });
  }
  
  userStates.set(chatId, {
    messagesToDelete: [originalMsgId, selectionMsg.message_id]
  });
};

// Social media (TikTok, Instagram, Facebook) processing
const processSocialMediaUrl = async (chatId, url, originalMsgId, platform) => {
  const loadingMsg = await bot.sendMessage(chatId, `⏳ Processing ${config.PLATFORMS[platform].name}...`);
  const loadingInterval = animateLoading(chatId, loadingMsg.message_id, 'Downloading');
  
  const mediaData = await downloadFromSocialMediaAPI(url);
  clearInterval(loadingInterval);
  
  if (!mediaData || !mediaData.status || !mediaData.data) {
    await bot.editMessageText(
      `❌ Error! Could not download from ${config.PLATFORMS[platform].name}.`,
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
    title: mediaData.data.title || `${config.PLATFORMS[platform].name} Video`,
    thumbnail: mediaData.data.thumbnail,
    videos: {
      high: mediaData.data.high,
      low: mediaData.data.low
    }
  });
  
  setTimeout(() => videoDataCache.delete(cacheId), 300000);
  
  const caption = `${config.PLATFORMS[platform].icon} *${config.PLATFORMS[platform].name}*

📹 *${mediaData.data.title || 'Video'}*

━━━━━━━━━━━━━━
✨ Select Format:
━━━━━━━━━━━━━━`;
  
  let selectionMsg;
  if (mediaData.data.thumbnail) {
    try {
      selectionMsg = await bot.sendPhoto(chatId, mediaData.data.thumbnail, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: createSocialMediaKeyboard(cacheId)
      });
    } catch (error) {
      selectionMsg = await bot.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: createSocialMediaKeyboard(cacheId)
      });
    }
  } else {
    selectionMsg = await bot.sendMessage(chatId, caption, {
      parse_mode: 'Markdown',
      reply_markup: createSocialMediaKeyboard(cacheId)
    });
  }
  
  userStates.set(chatId, {
    messagesToDelete: [originalMsgId, selectionMsg.message_id]
  });
};

// YouTube search
const processSearch = async (chatId, query, originalMsgId) => {
  const loadingMsg = await bot.sendMessage(chatId, '⏳ Searching YouTube...');
  const loadingInterval = animateLoading(chatId, loadingMsg.message_id, 'Searching');
  
  const results = await searchYouTube(query);
  clearInterval(loadingInterval);
  
  if (!results || results.length === 0) {
    await bot.editMessageText('❌ No results found.', { chat_id: chatId, message_id: loadingMsg.message_id });
    scheduleDelete(chatId, [loadingMsg.message_id, originalMsgId], 10000);
    return;
  }
  
  await bot.deleteMessage(chatId, loadingMsg.message_id);
  
  let resultText = `🔍 *Search Results*\n━━━━━━━━━━━━━━\n`;
  results.slice(0, 10).forEach((video, index) => {
    resultText += `*${index + 1}.* ${video.title}\n`;
  });
  resultText += `\n💬 Reply with number (1-${Math.min(results.length, 10)})`;
  
  let searchMsg;
  const thumbnail = results[0]?.thumbnail?.thumbnails?.[0]?.url;
  
  if (thumbnail) {
    try {
      searchMsg = await bot.sendPhoto(chatId, thumbnail, {
        caption: resultText,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      searchMsg = await bot.sendMessage(chatId, resultText, { parse_mode: 'Markdown' });
    }
  } else {
    searchMsg = await bot.sendMessage(chatId, resultText, { parse_mode: 'Markdown' });
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
      await bot.editMessageText('❌ Cancelled.', {
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
    const cacheId = parts[1];
    
    const mediaData = videoDataCache.get(cacheId);
    if (!mediaData) {
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Session expired.',
        show_alert: true
      });
      return;
    }
    
    let downloadUrl, type;
    
    if (downloadType === 'mp3') {
      downloadUrl = mediaData.videos?.high || mediaData.audio || mediaData[Object.keys(mediaData)[0]];
      type = 'mp3';
    } else if (downloadType === 'mp4_high') {
      downloadUrl = mediaData.videos.high;
      type = 'video';
    } else if (downloadType === 'mp4_low') {
      downloadUrl = mediaData.videos.low;
      type = 'video';
    } else if (downloadType.startsWith('yt_')) {
      const quality = downloadType.split('_')[1];
      downloadUrl = mediaData.videos?.[quality] || mediaData[quality];
      type = 'video';
    }
    
    try {
      await bot.deleteMessage(chatId, query.message.message_id);
    } catch (error) {}
    
    await sendMediaToTelegram(chatId, downloadUrl, type, mediaData);
    
    const userState = userStates.get(chatId);
    if (userState && userState.messagesToDelete) {
      scheduleDelete(chatId, userState.messagesToDelete, 5000);
    }
    userStates.delete(chatId);
  } catch (error) {
    console.error('Error in callback:', error);
    await bot.answerCallbackQuery(query.id, {
      text: '❌ Error occurred.',
      show_alert: true
    });
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('🚀 𝙃𝙚𝙘𝙩𝙞𝙘 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙚𝙧 𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 is running...');
console.log('👨‍💻 Created by:', config.CREATOR);
console.log('📊 Bot started at:', new Date().toLocaleString());
