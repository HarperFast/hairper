import { tool } from 'ai';
import { z } from 'zod/v3';
import { harperProcess } from '../../utils/harperProcess.ts';

export const stopHarperTool = tool({
	description: 'Stops all previously started Harper app background process.',
	inputSchema: z.object({}),
	execute: async () => {
		if (!harperProcess.running) {
			return `Error: No Harper application is currently running.`;
		}

		try {
			harperProcess.stop();
			return `Successfully stopped Harper application.`;
		} catch (error) {
			return `Error stopping Harper application: ${error}`;
		}
	},
});
