import { describe, expect, it } from 'vitest';
import { estimateTokens } from './estimateTokens';

describe('estimateTokens', () => {
	it('returns 0 for empty list', () => {
		expect(estimateTokens([])).toBe(0);
	});

	it('estimates tokens for simple text message', () => {
		const items = [
			{ role: 'user', content: 'hello' } as any,
		];
		// 'hello' is 5 chars. 5/4 = 1.25, ceil is 2.
		expect(estimateTokens(items)).toBe(2);
	});

	it('estimates tokens for message with content array', () => {
		const items = [
			{
				role: 'user',
				content: [
					{ text: 'hello' },
					{ content: ' world' },
				],
			} as any,
		];
		// 'hello world' is 11 chars. 11/4 = 2.75, ceil is 3.
		expect(estimateTokens(items)).toBe(3);
	});

	it('estimates tokens for message with text property', () => {
		const items = [
			{ text: 'some text' } as any,
		];
		// 'some text' is 9 chars. 9/4 = 2.25, ceil is 3.
		expect(estimateTokens(items)).toBe(3);
	});

	it('estimates tokens for function_call', () => {
		const items = [
			{
				type: 'function_call',
				call: { name: 'test', arguments: '{}' },
			} as any,
		];
		const json = JSON.stringify({ name: 'test', arguments: '{}' });
		const expected = Math.ceil(json.length / 4);
		expect(estimateTokens(items)).toBe(expected);
	});

	it('estimates tokens for function_call_result', () => {
		const items = [
			{
				type: 'function_call_result',
				result: { output: 'ok' },
			} as any,
		];
		const json = JSON.stringify({ output: 'ok' });
		const expected = Math.ceil(json.length / 4);
		expect(estimateTokens(items)).toBe(expected);
	});

	it('aggregates tokens across multiple items', () => {
		const items = [
			{ role: 'user', content: 'abc' } as any, // 3 chars
			{ role: 'assistant', content: 'defg' } as any, // 4 chars
		];
		// Total 7 chars. 7/4 = 1.75, ceil is 2.
		expect(estimateTokens(items)).toBe(2);
	});
});
