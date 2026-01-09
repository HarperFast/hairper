import {harperProcess} from './harperProcess.ts';
import {harperResponse} from './harperResponse.ts';

export function cleanUpAndSayBye() {
	if (harperProcess.running) {
		harperProcess.stop();
	}
	console.log('');
	harperResponse('See you later!');
}
