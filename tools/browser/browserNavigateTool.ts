import { tool } from '@openai/agents';
import { z } from 'zod';
import { getPage } from './browserManager';

const ToolParameters = z.object({
	url: z.string().describe('The URL to navigate to.'),
	waitUntil: z
		.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2'])
		.default('load')
		.describe('When to consider navigation succeeded.'),
});

export async function execute({ url, waitUntil }: z.infer<typeof ToolParameters>) {
	try {
		const page = await getPage();
		await page.goto(url, { waitUntil });
		return `Successfully navigated to ${url}`;
	} catch (error) {
		return `Error navigating to ${url}: ${error}`;
	}
}

export const browserNavigateTool = tool({
	name: 'browser_navigate',
	description: 'Navigates the browser to a specified URL.',
	parameters: ToolParameters,
	execute,
});
