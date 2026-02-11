import { tool } from '@openai/agents';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

const GitLogParameters = z.object({
	count: z.number().optional().default(10).describe('Number of commits to show.'),
	oneline: z.boolean().optional().default(true).describe('Whether to show log in oneline format.'),
});

export const gitLogTool = tool({
	name: 'git_log',
	description: 'Show commit logs.',
	parameters: GitLogParameters,
	async execute({ count, oneline }: z.infer<typeof GitLogParameters>) {
		try {
			const args = ['log', '-n', count.toString()];
			if (oneline) {
				args.push('--oneline');
			}
			const { stdout, stderr } = await execFileAsync('git', args);
			return stdout || stderr || 'No log output';
		} catch (error: any) {
			return `Error: ${error.stderr || error.message}`;
		}
	},
});
