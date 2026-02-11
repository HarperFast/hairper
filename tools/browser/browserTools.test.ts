import { createRequire } from 'node:module';
import { afterAll, describe, expect, it } from 'vitest';
import { execute as closeBrowser } from './browserCloseTool';
import { execute as getContent } from './browserGetContentTool';
import { execute as navigate } from './browserNavigateTool';
import { execute as takeScreenshot } from './browserScreenshotTool';

const require = createRequire(import.meta.url);
let hasPuppeteer = true;
try {
	require.resolve('puppeteer');
} catch {
	hasPuppeteer = false;
}

(hasPuppeteer ? describe : describe.skip)('Browser Tools', () => {
	it('should navigate to a page and get its content', async () => {
		// Using a simple data URL to avoid network dependency in tests
		const url = 'data:text/html,<html><body><h1>Hello World</h1></body></html>';

		const navResult = await navigate({ url, waitUntil: 'load' });
		expect(navResult).toContain('Successfully navigated to');

		const contentResult = await getContent({ type: 'text' });
		expect(contentResult).toContain('Hello World');
	}, 20000); // Higher timeout for browser launch

	it('should take a screenshot and return the ToolOutputImage format', async () => {
		const result = await takeScreenshot({ fullPage: false });
		expect(typeof result).toBe('object');
		if (typeof result === 'object' && result !== null) {
			expect('type' in result).toBe(true);
			expect(result.type).toBe('image');
			expect('image' in result).toBe(true);
			expect(typeof result.image).toBe('string');
			expect(result.image).toContain('data:image/jpeg;base64,');
			expect(result.image.length).toBeGreaterThan(100);
			expect(result.detail).toBe('auto');
		}
	}, 20000);

	afterAll(async () => {
		await closeBrowser();
	});
});
