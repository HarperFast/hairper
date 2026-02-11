import { tool } from '@openai/agents';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

const allowedActions = ['push', 'pop', 'apply', 'list'];

const GitStashParameters = z.object({
	action: z.string().describe('The stash action to perform: ' + allowedActions.join(', ')),
	message: z.string().describe('A message for the stash change.'),
});

export const gitStashTool = tool({
	name: 'git_stash',
	description: 'Stash changes or apply a stash.',
	parameters: GitStashParameters,
	async execute({ action, message }: z.infer<typeof GitStashParameters>) {
		try {
			if (!allowedActions.includes(action)) {
				return `Error: Invalid action '${action}'. Allowed actions are: ${allowedActions.join(', ')}`;
			}
			const args = ['stash', action];
			if (action === 'push' && message) {
				args.push('-m', message);
			}
			const { stdout, stderr } = await execFileAsync('git', args);
			return `Success: ${stdout || stderr || `Git stash ${action} completed`}`;
		} catch (error: any) {
			return `Error: ${error.stderr || error.message}`;
		}
	},
});
