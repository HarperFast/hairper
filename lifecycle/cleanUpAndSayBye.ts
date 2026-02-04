import { getGlobalTraceProvider } from '@openai/agents';
import chalk from 'chalk';
import { costTracker } from '../utils/sessions/cost';
import { harperProcess } from '../utils/shell/harperProcess';

export async function cleanUpAndSayBye() {
	costTracker.logFinalStats();
	if (harperProcess.startedByHairper) {
		harperProcess.stop();
	}
	console.log(`\n${chalk.bold('Harper:')} ${chalk.cyan('See you later!')}\n`);
	await getGlobalTraceProvider().forceFlush();
}
