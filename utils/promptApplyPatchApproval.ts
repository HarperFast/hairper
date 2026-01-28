import chalk from 'chalk';
import { askQuestion } from './askQuestion.ts';
import { printDiff } from './printDiff.ts';
import { spinner } from './spinner.ts';

interface Operation {
	type: string;
	path: string;
	diff?: string;
}

export async function promptApplyPatchApproval(
	operation: Operation,
): Promise<boolean> {
	spinner.stop();

	const autoApproved = process.env.APPLY_PATCH_AUTO_APPROVE === '1';
	let approved = autoApproved ? 'y' : 'n';

	if (!autoApproved) {
		console.log(chalk.bold.bgYellow.black(' Apply patch approval required: '));
	}

	console.log(`${chalk.bold(operation.type)}: ${operation.path}`);
	if ('diff' in operation && typeof operation.diff === 'string') {
		printDiff(operation.diff);
	}

	if (!autoApproved) {
		const answer = await askQuestion(`Proceed? [y/N] `);
		approved = answer.trim().toLowerCase();
	}

	spinner.start();

	return approved === 'y' || approved === 'yes' || approved === 'ok' || approved === 'k';
}
