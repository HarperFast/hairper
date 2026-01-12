import chalk from 'chalk';
import process from 'node:process';
import { askQuestion } from './askQuestion.ts';
import { isRiskyCommand } from './isRiskyCommand.ts';
import { mentionsIgnoredPath } from './mentionsIgnoredPath.ts';
import { spinner } from './spinner.ts';

export async function promptShellApproval(commands: string[]): Promise<boolean> {
	const foundRiskyCommand = commands.find(command => isRiskyCommand(command));
	const foundIgnoredInteraction = commands.find(command => mentionsIgnoredPath(command));

	if (process.env.SHELL_AUTO_APPROVE === '1') {
		if (!foundRiskyCommand && !foundIgnoredInteraction) {
			return true;
		}
		if (foundRiskyCommand) {
			console.log(
				chalk.bold.bgYellow.black(' Shell command approval of risky command required: \n'),
			);
		} else {
			console.log(
				chalk.bold.bgYellow.black(' Shell command approval of ignored file interaction required: \n'),
			);
		}
	}

	spinner.stop();

	console.log(
		chalk.bold.bgYellow.black(' Shell command approval required: \n'),
	);
	for (const cmd of commands) {
		console.log(chalk.dim(`  > ${cmd}`));
	}

	const answer = await askQuestion(`Proceed? [y/N] `);
	const approved = answer.trim().toLowerCase();

	spinner.start();

	return approved === 'y' || approved === 'yes' || approved === 'ok' || approved === 'k';
}
