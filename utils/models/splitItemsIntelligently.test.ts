import { describe, expect, it } from 'vitest';
import { splitItemsIntelligently } from './splitItemsIntelligently';

describe('splitItemsIntelligently', () => {
	it('splits at the requested target count if no tool calls are present', () => {
		const items = [
			{ type: 'message', content: '1' },
			{ type: 'message', content: '2' },
			{ type: 'message', content: '3' },
			{ type: 'message', content: '4' },
			{ type: 'message', content: '5' },
		];

		const { itemsToCompact, recentItems } = splitItemsIntelligently(items, 2);

		expect(itemsToCompact).toHaveLength(3);
		expect(recentItems).toHaveLength(2);
		expect(recentItems[0]!.content).toBe('4');
		expect(recentItems[1]!.content).toBe('5');
	});

	it('avoids splitting between function_call and function_call_result', () => {
		const items = [
			{ type: 'message', content: '1' },
			{ type: 'message', content: '2' },
			{ type: 'function_call', call: { name: 'tool' } },
			{ type: 'function_call_result', result: 'res' },
			{ type: 'message', content: '5' },
		];

		// Target is 2 recent items. Normally would split at index 3: [1, 2, call] and [result, 5]
		// But result is at index 3, so it should move split back to index 2.
		const { itemsToCompact, recentItems } = splitItemsIntelligently(items, 2);

		expect(itemsToCompact).toHaveLength(2);
		expect(recentItems).toHaveLength(3);
		expect(recentItems[0]!.type).toBe('function_call');
		expect(recentItems[1]!.type).toBe('function_call_result');
		expect(recentItems[2]!.content).toBe('5');
	});

	it('handles multiple consecutive results by moving back as far as needed', () => {
		const items = [
			{ type: 'message', content: '1' },
			{ type: 'function_call', call: { name: 'tool1' } },
			{ type: 'function_call_result', result: 'res1' },
			{ type: 'function_call', call: { name: 'tool2' } },
			{ type: 'function_call_result', result: 'res2' },
		];

		// Target 2. Split at index 3: [1, call1, res1] and [call2, res2].
		// call2 is NOT a result, so it stays at index 3.
		const { itemsToCompact, recentItems } = splitItemsIntelligently(items, 2);
		expect(itemsToCompact).toHaveLength(3);
		expect(recentItems).toHaveLength(2);
		expect(recentItems[0]!.type).toBe('function_call'); // tool2

		// Target 1. Split at index 4: [1, call1, res1, call2] and [res2].
		// res2 is a result, so move split back to 3: [1, call1, res1] and [call2, res2].
		const result2 = splitItemsIntelligently(items, 1);
		expect(result2.itemsToCompact).toHaveLength(3);
		expect(result2.recentItems).toHaveLength(2);
	});

	it('returns all items as recent if targetCount >= total items', () => {
		const items = [{ content: '1' }];
		const { itemsToCompact, recentItems } = splitItemsIntelligently(items, 5);
		expect(itemsToCompact).toHaveLength(0);
		expect(recentItems).toHaveLength(1);
	});

	it('returns all items to compact if targetCount is 0', () => {
		const items = [{ content: '1', type: 'message' }];
		const { itemsToCompact, recentItems } = splitItemsIntelligently(items, 0);
		expect(itemsToCompact).toHaveLength(1);
		expect(recentItems).toHaveLength(0);
	});
});
