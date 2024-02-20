//imports
import express from 'express';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { connect } from 'mongoose';
import axios from 'axios';
import UserSchema from './src/models/User.model.js';
import { coinPump, movingAverages } from './src/strategies/index.js';

dotenv.config();

// variables
const app = express();
const port = process.env.PORT || 3000;
const botToken = process.env.telegram_token || '';
export const bot = new TelegramBot(botToken, { polling: true });
export const chats = [];
const allTickers = [];
let counter = 0;

// constants
export const SECOND_SERVER = process.env.SECOND_SERVER;
const TIME_REQUEST_INTERVAL = 120000;
const CHECKING_PERIOD_MINUTES = 2;

app.get('/', (_, res) => {
	res.sendStatus(200);
});

app.listen(port, () => {
	console.log(`Server listening at port: ${port}`);
});

// mongo
connect(process.env.MONGO_DB || '')
	.then(async () => {
		console.log('connected to db');

		init();
	})
	.catch((err) => console.log(err.message));

// methods
const init = async () => {
	const users = await UserSchema.find();
	users.forEach(({ userId, name }) => {
		chats.push({ userId, name });
	});

	getTickers();
};

const getTickers = async () => {
	try {
		const { data } = await axios.get(`${SECOND_SERVER}/getTickers`);
		allTickers.push(data);

		if (allTickers.length === CHECKING_PERIOD_MINUTES) {
			// startCompare();
			await coinPump(allTickers);
			allTickers.shift();
		}

		if (counter % 50 === 0) {
			await checkTestCoins();
			console.log('checkTestCoins', counter);
		}

		counter++;
		setTimeout(getTickers, TIME_REQUEST_INTERVAL);
	} catch (error) {
		console.log(error);
		getTickers();
	}
};

const checkTestCoins = async () => {
	try {
		const { data } = await axios.post(`${SECOND_SERVER}/candles`, { symbol: 'AVAXUSDT', interval: '60', limit: 200 });
		const result = movingAverages(data);

		if (result) {
			bot.sendMessage(1046358765, `Moving average signal: ${result}`);
		}
	} catch (error) {
		console.log(error);
		counter--;
		getTickers();
	}
};

const getRandomMessage = () => {
	const messages = ['Не буровь', 'Я тебя не понимать', 'Пора бухать!', 'Валера, это ты?', 'Юрцэ - сальцэ'];
	const index = Math.floor(Math.random() * messages.length);
	return messages[index];
};

// events
bot.onText(/^(?!\/start$).*/, (msg) => {
	bot.sendMessage(msg.chat.id, getRandomMessage());
});

bot.onText(/\/start/, async (msg) => {
	const user = await UserSchema.findOne({ userId: msg.chat.id });
	if (!user) {
		const doc = new UserSchema({
			userId: msg.chat.id,
			name: msg.chat.first_name,
		});
		await doc.save();
	}

	const existUser = chats.find((user) => user.userId === msg.chat.id);
	if (!existUser) {
		chats.push({ userId: msg.chat.id, name: msg.chat.first_name });
	}

	bot.sendMessage(msg.chat.id, `Привет, ${msg.chat.first_name}! Земля плоская, а Юрец худой 😩. Ищу рост монет...`);

	const stickerId = 'CAACAgIAAxkBAAELNrZlqu7LWN1cGKKH-wxJTf7SVsx3kAACpgADJq3kEgNpHSDwdRPzNAQ';
	bot.sendSticker(msg.chat.id, stickerId);
});
