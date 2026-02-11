import { tool } from '@openai/agents';
import { z } from 'zod';
import { getPage } from './browserManager';

const ToolParameters = z.object({
	selector: z.string().describe('The CSS selector of the element to type into.'),
	text: z.string().describe('The text to type into the element.'),
	delay: z.number().default(0).describe('Delay between key presses in milliseconds.'),
});

export async function execute({ selector, text, delay }: z.infer<typeof ToolParameters>) {
	try {
		const page = await getPage();
		await page.type(selector, text, { delay });
		return `Successfully typed into ${selector}`;
	} catch (error) {
		return `Error typing into ${selector}: ${error}`;
	}
}

export const browserTypeTool = tool({
	name: 'browser_type',
	description: 'Types text into an element specified by a CSS selector.',
	parameters: ToolParameters,
	execute,
});
