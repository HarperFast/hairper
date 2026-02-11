import type { Browser, Page } from 'puppeteer';

let browser: Browser | null = null;
let page: Page | null = null;
const logs: string[] = [];

export async function getBrowser(): Promise<Browser> {
	if (!browser) {
		let puppeteer;
		try {
			puppeteer = await import('puppeteer');
		} catch {
			throw new Error(
				'Puppeteer is not installed. Browser tools require puppeteer. Please install it with `npm install puppeteer`.',
			);
		}
		browser = await puppeteer.default.launch({
			headless: false,
			defaultViewport: null,
		});
	}
	return browser;
}

export async function getPage(): Promise<Page> {
	if (!page) {
		const b = await getBrowser();
		const pages = await b.pages();
		if (pages.length > 0) {
			page = pages[0]!;
		} else {
			page = await b.newPage();
		}

		page.on('console', (msg) => {
			logs.push(`[${msg.type()}] ${msg.text()}`);
		});

		page.on('pageerror', (err) => {
			logs.push(`[error] ${(err as Error).message || err}`);
		});
	}
	return page;
}

export function getBrowserLogs(): string[] {
	return logs;
}

export function clearBrowserLogs(): void {
	logs.length = 0;
}

export async function closeBrowser(): Promise<void> {
	if (browser) {
		await browser.close();
		browser = null;
		page = null;
	}
}
