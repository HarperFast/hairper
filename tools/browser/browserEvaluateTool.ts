import { tool } from '@openai/agents';
import { z } from 'zod';
import { getPage } from './browserManager';

const ToolParameters = z.object({
	script: z.string().describe('The JavaScript to evaluate in the context of the page.'),
});

export async function execute({ script }: z.infer<typeof ToolParameters>) {
	try {
		const page = await getPage();
		const result = await page.evaluate(script);
		return JSON.stringify(result, null, 2);
	} catch (error) {
		return `Error evaluating script: ${error}`;
	}
}

export const browserEvaluateTool = tool({
	name: 'browser_evaluate',
	description: 'Evaluates JavaScript in the context of the current page.',
	parameters: ToolParameters,
	execute,
});
