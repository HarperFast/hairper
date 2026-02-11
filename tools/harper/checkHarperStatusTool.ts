import { tool } from '@openai/agents';
import { z } from 'zod';
import { harperProcess } from '../../utils/shell/harperProcess';

const ToolParameters = z.object({});

export const checkHarperStatusTool = tool({
	name: 'check_harper_status',
	description: 'Checks if a Harper application is currently running.',
	parameters: ToolParameters,
	async execute() {
		if (harperProcess.running) {
			return 'A Harper application is currently running.';
		} else {
			return 'No Harper application is currently running.';
		}
	},
});
