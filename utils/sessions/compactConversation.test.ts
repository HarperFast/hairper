import { run, system, user } from '@openai/agents';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackedState } from '../../lifecycle/trackedState';
import { compactConversation } from './compactConversation';

vi.mock('@openai/agents', async () => {
	const actual = await vi.importActual<typeof import('@openai/agents')>('@openai/agents');
	return {
		...actual,
		run: vi.fn().mockResolvedValue({ finalOutput: 'Key facts decided.' }),
	};
});

// Mock dependencies for the batching test
vi.mock('../models/estimateTokens', async () => {
	const actual = await vi.importActual<any>('../models/estimateTokens');
	return {
		...actual,
		estimateTokens: vi.fn(),
	};
});

vi.mock('./modelContextLimits', async () => {
	const actual = await vi.importActual<any>('./modelContextLimits');
	return {
		...actual,
		getModelContextLimit: vi.fn(),
	};
});

import { estimateTokens } from '../models/estimateTokens';
import { getModelContextLimit } from './modelContextLimits';

describe('compactConversation utility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Ensure the implementation takes the compaction path
		trackedState.compactionModel = 'gpt-5-nano';
		// Default mocked summary
		(run as any).mockResolvedValue({ finalOutput: 'Key facts decided.' });
	});

	afterEach(() => {
		trackedState.compactionModel = '';
	});

	it('builds compacted items with a model-based summary in the notice', async () => {
		const items = [
			system('instructions'),
			user('u1'),
			user('u2'),
			user('u3'),
			user('u4'),
			user('u5'),
			user('u6'),
		];

		const { noticeContent, itemsToAdd } = await compactConversation(items as any);

		expect(noticeContent).toMatch(/Key observations from earlier:/i);
		expect(noticeContent).toMatch(/Key facts decided\./);

		// key observations + last 3
		expect(itemsToAdd.length).toBe(4);
		expect((itemsToAdd[0] as any).role).toBe('system');
		expect((itemsToAdd[1] as any).role).toBe('user');

		const lastThree = itemsToAdd.slice(-3).map((it: any) => it.content?.[0]?.text ?? it.content);
		expect(lastThree).toEqual(['u4', 'u5', 'u6']);

		expect(run as any).toHaveBeenCalled();
	});

	it('falls back to default notice if model throws', async () => {
		(run as any).mockRejectedValueOnce(new Error('bang'));
		const items = [
			system('instructions'),
			user('u1'),
			user('u2'),
			user('u3'),
			user('u4'),
			user('u5'),
			user('u6'),
		];

		const { noticeContent } = await compactConversation(items as any);
		expect(noticeContent).toBe('... conversation history compacted (4 items, 0 tool calls) ...');
	});

	it('batches compaction if items exceed context limit', async () => {
		// Mock estimateTokens to return a large value for a full list
		(estimateTokens as any).mockImplementation((items: any[]) => items.length * 1000); // 1000 tokens per item

		// Set a low context limit for testing
		(getModelContextLimit as any).mockReturnValue(2500); // Only fits 2 items comfortably (2.5k limit, 0.9*2.5k = 2.25k target)

		const itemsMany = [
			user('u1'),
			user('u2'),
			user('u3'),
			user('u4'),
			user('u5'),
			user('u6'),
			user('u7'), // last 3 are u5, u6, u7. Items to compact are u1, u2, u3, u4 (4000 tokens).
		];

		// Reset mocks for the next call
		(run as any).mockReset();
		(run as any).mockResolvedValueOnce({ finalOutput: 'Summary 1' })
			.mockResolvedValueOnce({ finalOutput: 'Summary 2' });

		const result = await compactConversation(itemsMany as any);

		expect(result.noticeContent).toContain('Summary 1');
		expect(result.noticeContent).toContain('Summary 2');
		expect(run).toHaveBeenCalledTimes(2); // 4 items / 2 items per batch = 2 calls
	});
});
