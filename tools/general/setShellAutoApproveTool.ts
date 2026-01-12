import { tool } from '@openai/agents';
import { z } from 'zod';
import { updateEnv } from '../../utils/updateEnv.ts';

const SetShellAutoApproveParameters = z.object({
	autoApprove: z.boolean(),
});

export const setShellAutoApproveTool = tool({
	name: 'setShellAutoApproveTool',
	description:
		'Enable or disable automatic approval for shell commands by setting SHELL_AUTO_APPROVE=1 or 0 in .env and current process.',
	parameters: SetShellAutoApproveParameters,
	needsApproval: true,
	async execute({ autoApprove }: z.infer<typeof SetShellAutoApproveParameters>) {
		const newValue = autoApprove ? '1' : '0';
		if (process.env.SHELL_AUTO_APPROVE === newValue) {
			return `SHELL_AUTO_APPROVE is already set to ${newValue} in the current process.`;
		}

		try {
			await updateEnv('SHELL_AUTO_APPROVE', newValue);
			return `SHELL_AUTO_APPROVE has been set to ${newValue} in .env and current process.`;
		} catch (error: any) {
			return `Error updating .env file: ${error.message}`;
		}
	},
});
