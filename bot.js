import { JSONFilePreset } from 'lowdb/node'
import TelegramBot from 'node-telegram-bot-api'
const token = '6918176800:AAEex7zg8TmO3HMpecVlmAV3Vm3liA8D5bQ';

// Read or create db.json
const defaultData = { posts: [] }
const db = await JSONFilePreset('db.json', defaultData)

// Update db.json
// await db.update(({ posts }) => posts.push('hello world'))

// Alternatively you can call db.write() explicitely later
// to write to db.json
// db.data.posts.push('hello world')
// await db.write()


// replace the value below with the Telegram token you receive from @BotFather

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.

// Create
bot.onText(/\/add (.+)/, async (msg, match) => {
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
bot.onText(/\/read/, async (msg) => {
    const chatId = msg.chat.id;
    const allPosts = db.data.posts;
    const postsMessage = allPosts.map((post, index) => `${index + 1}. ${post}`).join('\n');
    bot.sendMessage(chatId, `chatnya:\n${postsMessage}`);
});

// Update
bot.onText(/\/update (\d+) (.+)/, async (msg, match) => {
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
bot.onText(/\/delete (\d+)/, async (msg, match) => {
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
    anu susss
    /add
    /update
    /delete
    /read
    
    `);
});