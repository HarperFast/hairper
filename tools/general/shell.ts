import { tool } from 'ai';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod/v3';
import { promptShellApproval } from '../../utils/promptShellApproval.ts';

const execAsync = promisify(exec);

export const shellTool = tool({
	description:
		'Executes shell commands in the current working directory. Use this for running build commands, git operations, npm commands, etc.',
	inputSchema: z.object({
		command: z.string().describe('The shell command to execute'),
	}),
	execute: async ({ command }) => {
		// Request approval before executing
		const approved = await promptShellApproval([command]);
		if (!approved) {
			return 'Command execution cancelled by user.';
		}

		try {
			const { stdout, stderr } = await execAsync(command, {
				cwd: process.cwd(),
				timeout: 60000, // 60 second timeout
				maxBuffer: 10 * 1024 * 1024, // 10MB buffer
			});

			let result = '';
			if (stdout) {
				result += stdout;
			}
			if (stderr) {
				result += (result ? '\n' : '') + `stderr: ${stderr}`;
			}
			return result || 'Command completed successfully with no output.';
		} catch (error: any) {
			const stdout = error.stdout || '';
			const stderr = error.stderr || '';
			const exitCode = error.code ?? 'unknown';
			return `Command failed with exit code ${exitCode}.\nstdout: ${stdout}\nstderr: ${stderr}`;
		}
	},
});
