import { tool } from '@openai/agents';
import { z } from 'zod';
import { getPage } from './browserManager';

const ToolParameters = z.object({
	selector: z.string().describe('The CSS selector of the element to check for presence.'),
});

export async function execute({ selector }: z.infer<typeof ToolParameters>) {
	try {
		const page = await getPage();
		const element = await page.$(selector);
		return element !== null ? `Element ${selector} is present.` : `Element ${selector} is not present.`;
	} catch (error) {
		return `Error checking for element ${selector}: ${error}`;
	}
}

export const browserIsElementPresentTool = tool({
	name: 'browser_is_element_present',
	description: 'Checks if an element is present on the page.',
	parameters: ToolParameters,
	execute,
});
