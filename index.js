//imports
import express from 'express';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { connect } from 'mongoose';
import UserSchema from './models/User.model.js';
import axios from 'axios';

dotenv.config();

// variables
const app = express();
const port = process.env.PORT || 3000;
const botToken = process.env.telegram_token || '';
const bot = new TelegramBot(botToken, { polling: true });
const chats = [];
const allTickers = [];

// constants
const TIME_REQUEST_INTERVAL = 60000;
const CHECKING_PERIOD_MINUTES = 2;
const PERCENT = 10;

app.get('/', (_, res) => {
	res.sendStatus(200);
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
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
		const { data } = await axios.get('https://testing-bot-bv1v.onrender.com/getTickers');
		allTickers.push(data);

		if (allTickers.length === CHECKING_PERIOD_MINUTES) {
			startCompare();
			allTickers.shift();
		}

		setTimeout(getTickers, TIME_REQUEST_INTERVAL);
	} catch (error) {
		console.log(error);
	}
};

const startCompare = () => {
	allTickers[allTickers.length - 1].forEach(({ symbol, lastPrice, price24hPcnt }) => {
		const prevTicker = allTickers[0].find((item) => item.symbol === symbol);

		if (prevTicker) {
			const price24hPercent = +price24hPcnt * 100;
			const shortPerodPercent = ((+lastPrice - +prevTicker.lastPrice) / +prevTicker.lastPrice) * 100;

			if (
				(shortPerodPercent >= PERCENT && price24hPercent >= 5) ||
				(shortPerodPercent <= -10 && price24hPercent <= -5)
			) {
				const roundedPrice = (+lastPrice).toFixed(4);
				const roundedPercent = Math.round(shortPerodPercent * 1000) / 1000;

				const text = `
				🍺 Signal <i>${shortPerodPercent < 0 ? 'down' : 'up'}</i>
				Token: <b>${symbol}</b>
				Price: ${roundedPrice}
				Percent: ${roundedPercent}%
				Percent 24h: ${price24hPercent.toFixed(3)}%
				`;

				if (chats.length) {
					chats.forEach(async ({ userId }) => {
						await bot.sendMessage(userId, text, { parse_mode: 'HTML' });
					});
				}
			}
		}
	});
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
