import { tool } from '@openai/agents';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

const GitStatusParameters = z.object({
	short: z.boolean().optional().default(false).describe('Whether to show the status in short format.'),
});

export const gitStatusTool = tool({
	name: 'gitStatusTool',
	description: 'Show the working tree status.',
	parameters: GitStatusParameters,
	async execute({ short }: z.infer<typeof GitStatusParameters>) {
		try {
			const args = ['status'];
			if (short) {
				args.push('--short');
			}
			const { stdout, stderr } = await execFileAsync('git', args);
			return stdout || stderr || 'No status output';
		} catch (error: any) {
			return `Error: ${error.stderr || error.message}`;
		}
	},
});
