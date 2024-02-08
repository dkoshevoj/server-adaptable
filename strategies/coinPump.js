import axios from 'axios';
import { SECOND_SERVER, bot, chats } from '../index.js';
import { getPlotImage } from '../plot.js';

export const coinPump = async (allTickers) => {
	allTickers[allTickers.length - 1].forEach(async ({ symbol, lastPrice, price24hPcnt }) => {
		const prevTicker = allTickers[0].find((item) => item.symbol === symbol);

		if (prevTicker) {
			const price24hPercent = +price24hPcnt * 100;
			const shortPerodPercent = ((+lastPrice - +prevTicker.lastPrice) / +prevTicker.lastPrice) * 100;

			if ((shortPerodPercent >= 10 && price24hPercent >= 5) || (shortPerodPercent <= -10 && price24hPercent <= -5)) {
				const roundedPrice = (+lastPrice).toFixed(4);
				const roundedPercent = Math.round(shortPerodPercent * 1000) / 1000;

				const text = `
				🍺 Signal <i>${shortPerodPercent < 0 ? 'down' : 'up'}</i>
				Token: <b>${symbol}</b>
				Price: ${roundedPrice}
				Percent: ${roundedPercent}%
				Percent 24h: ${price24hPercent.toFixed(3)}%`;

				sendSignal(text, symbol);
			}
		}
	});
};

const sendSignal = async (text, symbol) => {
	try {
		const candles = await axios.post(`${SECOND_SERVER}/candles`, { symbol, interval: '1', limit: 20 });

		const buffer = await getPlotImage(candles.data, symbol);

		if (chats.length) {
			chats.forEach(async ({ userId }) => {
				bot.sendPhoto(userId, buffer, { caption: text, parse_mode: 'HTML' });
			});
		}
	} catch (error) {
		console.log(error);
	}
};
