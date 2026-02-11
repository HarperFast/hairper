import { tool } from '@openai/agents';
import { z } from 'zod';
import { getPage } from './browserManager';

const ToolParameters = z.object({
	type: z.enum(['html', 'text']).default('html').describe('The type of content to retrieve (html or text).'),
});

export async function execute({ type }: z.infer<typeof ToolParameters>) {
	try {
		const page = await getPage();
		if (type === 'text') {
			return await page.evaluate(() => document.body.innerText);
		}
		return await page.content();
	} catch (error) {
		return `Error getting content: ${error}`;
	}
}

export const browserGetContentTool = tool({
	name: 'browser_get_content',
	description: 'Gets the content (HTML or text) of the current page.',
	parameters: ToolParameters,
	execute,
});
