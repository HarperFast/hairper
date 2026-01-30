import { tool } from 'ai';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import { z } from 'zod/v3';

const alreadyOpened = new Set<string>();

export const openBrowserTool = tool({
	description: "Opens the requested URL in the user's browser.",
	inputSchema: z.object({
		url: z.string().describe('The starting URL of the browser (i.e. http://localhost:9926)'),
	}),
	execute: async ({ url }) => {
		try {
			if (alreadyOpened.has(url)) {
				return `Browser for '${url}' is already open.`;
			}

			const p = platform();
			if (p === 'darwin') {
				spawn('open', [url]);
			} else if (p === 'win32') {
				spawn('start', ['', url]);
			} else {
				spawn('xdg-open', [url]);
			}
			alreadyOpened.add(url);
			return `Successfully opened '${url}' in the browser.`;
		} catch (error) {
			return `Error opening browser: ${error}`;
		}
	},
});
