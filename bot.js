import { JSONFilePreset } from 'lowdb/node';
import TelegramBot from 'node-telegram-bot-api';
import Bot from 'grammy';
import Groq from 'groq-sdk';
import ytdl from 'ytdl-core';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const token = '6918176800:AAEex7zg8TmO3HMpecVlmAV3Vm3liA8D5bQ';

const groq = new Groq({
    apiKey: "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"
});

async function getGroqResponse(query) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: query,
                },
            ],
            model: "Llama3-8b-8192",
            temperature: 0.5,
            max_tokens: 1024,
            top_p: 1,
            stop: null,
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error(error);
    }
}

// Read or create db.json
const defaultData = { posts: [] };
const db = await JSONFilePreset('db.json', defaultData);

// Update db.json
// await db.update(({ posts }) => posts.push('hello world'))

// Alternatively you can call db.write() explicitely later
// to write to db.json
// db.data.posts.push('hello world')
// await db.write()

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {
    polling: true,
    request: {
        agentOptions: {
            keepAlive: true,
            family: 4
        }
    }
});

// Fungsi untuk mendownload video YouTube dengan kualitas rendah
async function downloadYouTubeVideoLowQuality(url, filePath) {
    const stream = ytdl(url, { quality: 'lowestvideo' });
    await pipeline(stream, fs.createWriteStream(filePath));
}

// Menghandle perintah /yt
bot.onText(/\/yt (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[1];
    const filePath = resolve(__dirname, 'video.mp4');

    try {
        bot.sendMessage(chatId, 'Downloading video...');

        await downloadYouTubeVideoLowQuality(url, filePath);
        
        bot.sendMessage(chatId, 'Sending video...');

        await bot.sendVideo(chatId, filePath);
        
        // Menghapus file setelah dikirim untuk menghemat ruang
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, 'Failed to download or send the video.');
    }
});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
    bot.sendMessage(chatId, resp);
});

// Bot AI
bot.onText(/\/a (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1] + ", tolong gunakan bahasa Indonesia untuk menjelaskannya";

    try {
        const response = await getGroqResponse(query);
        bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil respon.');
    }
});

// Listen for messages that are replied to by users
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const replyToMessage = msg.reply_to_message;

    // Check if the replied message is from a user
    if (replyToMessage && replyToMessage.from && !replyToMessage.from.is_bot) {
        try {
            const response = await getGroqResponse(msg.text);
            bot.sendMessage(chatId, response, { reply_to_message_id: replyToMessage.message_id });
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, 'Error occurred while fetching response.', { reply_to_message_id: replyToMessage.message_id });
        }
    }
});

// Create
bot.onText(/\/c (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const newPost = match[1];
    try {
        await db.update(({ posts }) => posts.push(newPost));
        bot.sendMessage(chatId, `matap lurr ${newPost} udah masuk`);
    } catch (err) {
        bot.sendMessage(chatId, 'error');
    }
});

// Read
bot.onText(/\/r/, async (msg) => {
    const chatId = msg.chat.id;
    const allPosts = db.data.posts;
    const postsMessage = allPosts.map((post, index) => `${index + 1}. ${post}`).join('\n');
    bot.sendMessage(chatId, `chatnya:\n${postsMessage}`);
});

// Update
bot.onText(/\/u (\d+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const indexToUpdate = parseInt(match[1]) - 1;
    const updatedPostData = match[2];
    try {
        await db.update(({ posts }) => posts[indexToUpdate] = updatedPostData);
        bot.sendMessage(chatId, 'udah di apdet');
    } catch (err) {
        bot.sendMessage(chatId, 'error bang');
    }
});

// Delete
bot.onText(/\/d (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const indexToDelete = parseInt(match[1]) - 1;
    try {
        await db.update(({ posts }) => posts.splice(indexToDelete, 1));
        bot.sendMessage(chatId, 'dihapus');
    } catch (err) {
        bot.sendMessage(chatId, 'error');
    }
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, `
    Cara pake bot ini
    /yt [URL] - Download video dari YouTube
    /c [pesan] - Menambahkan pesan ke database
    /r - Membaca semua pesan dari database
    /u [nomor] [pesan baru] - Memperbarui pesan
    /d [nomor] - Menghapus pesan
    /a [pertanyaan] - Menggunakan AI untuk menjawab pertanyaan
    `);
});

bot.on("polling_error", (msg) => console.log(msg));
