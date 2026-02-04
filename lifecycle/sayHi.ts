import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { trackedState } from './trackedState';

export function sayHi() {
	const harperAppExists = existsSync(join(trackedState.cwd, 'config.yaml'));
	const vibing = harperAppExists ? 'updating' : 'creating';
	const instructions = `You are working on ${vibing} a harper app with the user.`;

	const welcomeMessage = harperAppExists
		? 'What do you want to do together today?'
		: 'What kind of Harper app do you want to make together?';

	return {
		name: 'Harper App Development Assistant',
		instructions,
		info: [
			`Working directory: ${chalk.cyan(trackedState.cwd)}`,
			`Harper app detected: ${chalk.cyan(harperAppExists ? 'Yes' : 'No')}`,
			`Press Ctrl+C or hit enter twice to exit.\n`,
		],
		welcomeMessage,
	};
}
