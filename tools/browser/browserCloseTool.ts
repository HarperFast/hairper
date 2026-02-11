import { tool } from '@openai/agents';
import { z } from 'zod';
import { closeBrowser } from './browserManager';

const ToolParameters = z.object({});

export async function execute() {
	try {
		await closeBrowser();
		return 'Browser closed successfully.';
	} catch (error) {
		return `Error closing browser: ${error}`;
	}
}

export const browserCloseTool = tool({
	name: 'browser_close',
	description: 'Closes the browser instance.',
	parameters: ToolParameters,
	execute,
});
