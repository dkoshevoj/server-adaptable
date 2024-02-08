import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import dayjs from 'dayjs';

export const getPlotImage = async (data, symbol) => {
	const prices = data.map((item) => +item[4]);
	const times = data.map((item) => dayjs(item[0]).format('HH:mm'));

	const width = 600;
	const height = 400;
	const backgroundColour = 'white';
	const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

	const configuration = {
		type: 'line',
		data: {
			labels: times,
			datasets: [
				{
					label: symbol,
					data: prices,
					// fill: true,
					fill: {
						target: 'origin',
						above: 'rgba(0, 0, 255, 0.2)', // Area will be red above the origin
						// below: 'rgb(0, 0, 255)', // And blue below the origin
					},
					borderColor: ['rgb(51, 204, 204)'],
					borderWidth: 5,
					xAxisID: 'xAxis1', //define top or bottom axis ,modifies on scale
					pointRadius: 0,
				},
			],
		},
		// options: {
		// 	scales: {
		// 		y: {
		// 			suggestedMin: 0,
		// 		},
		// 	},
		// },
	};

	async function run() {
		const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
		const base64Image = dataUrl;

		const base64Data = base64Image.replace(/^data:image\/png;base64,/, '');

		const buffer = Buffer.from(base64Data, 'base64');
		return buffer;
	}
	return run();
};
