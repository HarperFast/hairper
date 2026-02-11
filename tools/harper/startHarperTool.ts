import { tool } from '@openai/agents';
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { z } from 'zod';
import { isIgnored } from '../../utils/files/aiignore';
import { sleep } from '../../utils/promises/sleep';
import { harperProcess } from '../../utils/shell/harperProcess';

const ToolParameters = z.object({
	directoryName: z
		.string()
		.describe('The name of the directory that the Harper app is in.'),
});

export const startHarperTool = tool({
	name: 'start_harper',
	description:
		'Starts a Harper app background process, allowing you to observe the app in action (by readHarperLogsTool, hitHarperAPITool, etc).',
	parameters: ToolParameters,
	async execute({ directoryName }: z.infer<typeof ToolParameters>) {
		if (isIgnored(directoryName)) {
			return `Error: Target directory ${directoryName} is restricted by .aiignore`;
		}

		if (harperProcess.running) {
			return `Success! A Harper application is already running, and will auto-reload as changes are made.`;
		}

		try {
			// If the provided directory doesn't exist relative to CWD, but matches the
			// current directory's folder name, use the current working directory.
			let effectiveDirectory = directoryName;
			const candidatePath = resolve(process.cwd(), directoryName);
			if (!existsSync(candidatePath)) {
				const cwd = process.cwd();
				if (basename(cwd) === directoryName) {
					effectiveDirectory = cwd;
				}
			}

			harperProcess.start(effectiveDirectory);
			await sleep(5000);
			const logs = harperProcess.getAndClearLogs();
			return `Successfully started Harper application with auto-reload in '${effectiveDirectory}' with initial logs:\n${logs}`;
		} catch (error) {
			return `Error: failed to start Harper application: ${error}`;
		}
	},
});
