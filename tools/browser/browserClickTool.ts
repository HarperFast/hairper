import { tool } from '@openai/agents';
import { z } from 'zod';
import { getPage } from './browserManager';

const ToolParameters = z.object({
	selector: z.string().describe('The CSS selector of the element to click.'),
	button: z.enum(['left', 'right', 'middle']).default('left').describe('The button to use for the click.'),
	clickCount: z.number().default(1).describe('The number of times to click.'),
});

export async function execute({ selector, button, clickCount }: z.infer<typeof ToolParameters>) {
	try {
		const page = await getPage();
		await page.click(selector, { button, clickCount });
		return `Successfully clicked on ${selector}`;
	} catch (error) {
		return `Error clicking on ${selector}: ${error}`;
	}
}

export const browserClickTool = tool({
	name: 'browser_click',
	description: 'Clicks on an element specified by a CSS selector.',
	parameters: ToolParameters,
	execute,
});
