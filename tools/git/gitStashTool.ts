import { tool } from '@openai/agents';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';

const execAsync = promisify(exec);

const GitStashParameters = z.object({
	action: z.enum(['push', 'pop', 'apply', 'list']).describe('The stash action to perform.'),
	message: z.string().optional().describe('A message for the stash (only used for "push").'),
});

export const gitStashTool = tool({
	name: 'gitStash',
	description: 'Stash changes or apply a stash.',
	parameters: GitStashParameters,
	async execute({ action, message }: z.infer<typeof GitStashParameters>) {
		try {
			let command = `git stash ${action}`;
			if (action === 'push' && message) {
				command += ` -m "${message.replace(/"/g, '\\"')}"`;
			}
			const { stdout, stderr } = await execAsync(command);
			return `Success: ${stdout || stderr || `Git stash ${action} completed`}`;
		} catch (error: any) {
			return `Error: ${error.stderr || error.message}`;
		}
	},
});
