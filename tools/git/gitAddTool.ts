import { tool } from '@openai/agents';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

const GitAddParameters = z.object({
	files: z.array(z.string()).describe('The files to add. If not provided, all changes will be added.'),
});

export const gitAddTool = tool({
	name: 'git_add',
	description: 'Add file contents to the index.',
	parameters: GitAddParameters,
	async execute({ files }: z.infer<typeof GitAddParameters>) {
		try {
			const args = ['add'];
			if (!files || files.length === 0) {
				args.push('.');
			} else {
				args.push(...files);
			}
			const { stdout, stderr } = await execFileAsync('git', args);
			return `Success: ${stdout || stderr || 'Files added to index'}`;
		} catch (error: any) {
			return `Error: ${error.stderr || error.message}`;
		}
	},
});
