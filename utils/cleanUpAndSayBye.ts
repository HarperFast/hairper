import { harperProcess } from './harperProcess.ts';
import { harperResponse } from './harperResponse.ts';

export function cleanUpAndSayBye() {
	if (harperProcess.startedByHairper) {
		harperProcess.stop();
	}
	console.log('');
	harperResponse('See you later!');
}
