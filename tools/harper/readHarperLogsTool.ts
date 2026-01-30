import { tool } from 'ai';
import { z } from 'zod/v3';
import { harperProcess } from '../../utils/harperProcess.ts';

export const readHarperLogsTool = tool({
	description: 'Reads the most recent console logs of a started Harper app.',
	inputSchema: z.object({}),
	execute: async () => {
		if (!harperProcess.running) {
			return `Error: No Harper application is currently running.`;
		}

		try {
			const logs = harperProcess.getAndClearLogs();
			return logs || 'No logs available yet.';
		} catch (error) {
			return `Error reading Harper application logs: ${error}`;
		}
	},
});
