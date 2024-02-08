import * as ta from 'technicalindicators';

export const movingAverages = (candles) => {
	const closes = candles.map((item) => item[3]);
	const sma21 = ta.sma({ period: 21, values: closes });
	const sma70 = ta.sma({ period: 70, values: closes });

	if (sma21.at(-2) < sma70.at(-2) && sma21.at(-1) > sma70.at(-1)) {
		return 'BUY';
	} else if (sma21.at(-2) > sma70.at(-2) && sma21.at(-1) < sma70.at(-1)) {
		return 'SELL';
	}

	return false;
};
