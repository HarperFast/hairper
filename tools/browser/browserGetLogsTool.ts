import { tool } from '@openai/agents';
import { z } from 'zod';
import { clearBrowserLogs, getBrowserLogs } from './browserManager';

const ToolParameters = z.object({
	clear: z.boolean().default(false).describe('Whether to clear the logs after reading them.'),
});

export async function execute({ clear }: z.infer<typeof ToolParameters>) {
	const logs = getBrowserLogs();
	const result = logs.length > 0 ? logs.join('\n') : 'No logs found.';
	if (clear) {
		clearBrowserLogs();
	}
	return result;
}

export const browserGetLogsTool = tool({
	name: 'browser_get_logs',
	description: 'Returns the console logs from the browser.',
	parameters: ToolParameters,
	execute,
});
