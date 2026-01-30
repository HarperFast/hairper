import { tool } from 'ai';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { z } from 'zod/v3';
import { isIgnored } from '../../utils/aiignore.ts';
import { applyTemplateToDirectory } from '../../utils/applyTemplateToDirectory.ts';

export const createNewHarperApplicationTool = tool({
	description: 'Creates a new harper application by downloading the application template zip archive.',
	inputSchema: z.object({
		directoryName: z.string().describe('The name of the directory to download the template into.'),
	}),
	execute: async ({ directoryName }) => {
		if (isIgnored(directoryName)) {
			return `Error: Target directory ${directoryName} is restricted by .aiignore`;
		}
		try {
			if (!fs.existsSync(directoryName)) {
				fs.mkdirSync(directoryName, { recursive: true });
			}

			const error = await applyTemplateToDirectory(directoryName);
			if (error) {
				return error;
			}

			console.log(`Initializing new Git repository...`);
			execSync('git init', { cwd: directoryName, stdio: 'ignore' });

			return `Successfully created new Harper application in '${directoryName}' and initialized Git repository.`;
		} catch (error) {
			return `Error creating new Harper application: ${error}`;
		}
	},
});
