import { tool } from '@openai/agents';
import { z } from 'zod';
import { getPage } from './browserManager';

const ToolParameters = z.object({
	fullPage: z
		.boolean()
		.default(false)
		.describe('Whether to take a screenshot of the full scrollable page.'),
});

export async function execute({ fullPage }: z.infer<typeof ToolParameters>) {
	try {
		const page = await getPage();
		const screenshot = await page.screenshot({
			encoding: 'base64',
			type: 'jpeg',
			quality: 80,
			fullPage,
		});
		return {
			type: 'image',
			image: `data:image/jpeg;base64,${screenshot}`,
			detail: 'auto',
		};
	} catch (error) {
		return `Error taking screenshot: ${error}`;
	}
}

export const browserScreenshotTool = tool({
	name: 'browser_screenshot',
	description: 'Takes a screenshot of the current page.',
	parameters: ToolParameters,
	execute,
});
