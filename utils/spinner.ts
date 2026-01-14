import process from 'node:process';
import { createInterface, Interface } from 'node:readline';

class Spinner {
	public interrupt: (() => void) | null = null;

	private interval: NodeJS.Timeout | null = null;
	private chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
	private i = 0;
	private readonly message: string;
	public status = '';
	private rl: Interface | null = null;

	private readonly checkLine = (line: string) => {
		if (line === '' && this.interrupt) {
			this.rl?.close();
			this.interrupt();
		}
	};

	constructor(message: string = 'Thinking...') {
		this.message = message;
	}

	start() {
		if (this.interval) {
			return;
		}

		this.rl = createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: false,
		});
		this.rl.on('line', this.checkLine);

		this.i = 0;
		process.stdout.write(`${this.chars[this.i]} ${this.message}${this.status ? ' ' + this.status : ''}`);
		this.interval = setInterval(() => {
			this.i = (this.i + 1) % this.chars.length;
			process.stdout.write(`\r${this.chars[this.i]} ${this.message}${this.status ? ' ' + this.status : ''}`);
		}, 80);
	}

	stop() {
		if (!this.interval) { return; }
		clearInterval(this.interval);
		this.rl?.close();
		this.rl = null;
		this.interval = null;
		this.status = '';
		process.stdout.write('\r\x1b[K');
	}
}

export const spinner = new Spinner();
