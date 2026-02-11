import { createInterface } from 'node:readline';
import { handleExit } from '../../lifecycle/handleExit';

export async function askQuestion(query: string): Promise<string> {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: true,
	});

	rl.on('SIGINT', handleExit);

	return await new Promise<string>((resolve) => {
		const lines: string[] = [];
		let timer: NodeJS.Timeout | null = null;
		let finished = false;
		const DEBOUNCE_MS = 75;

		const finish = () => {
			if (finished) { return; }
			finished = true;
			if (timer) { clearTimeout(timer); }
			rl.removeListener('line', onLine);
			console.log('');
			rl.close();
			resolve(lines.join('\n'));
		};

		const onLine = (line: string) => {
			lines.push(line);
			if (timer) { clearTimeout(timer); }
			timer = setTimeout(finish, DEBOUNCE_MS);
		};

		rl.on('line', onLine);
		rl.setPrompt(query);
		rl.prompt();
	});
}
