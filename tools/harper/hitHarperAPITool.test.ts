import type { RunContext } from '@openai/agents';
import { describe, expect, it } from 'vitest';
import { hitHarperAPITool } from './hitHarperAPITool.ts';

describe('hitHarperAPITool needsApproval', () => {
	// @ts-expect-error - simple mock context
	const runContext: RunContext = {};

	it('should return false for GET requests', async () => {
		const result = await hitHarperAPITool.needsApproval(runContext, { method: 'GET', path: '/Resource/' }, 'callId');
		expect(result).toBe(false);
	});

	it('should return false for DELETE requests with an ID', async () => {
		const result = await hitHarperAPITool.needsApproval(
			runContext,
			{ method: 'DELETE', path: '/Resource/123' },
			'callId',
		);
		expect(result).toBe(false);
	});

	it('should return false for DELETE requests with a UUID', async () => {
		const result = await hitHarperAPITool.needsApproval(runContext, {
			method: 'DELETE',
			path: '/Resource/13d8c49c-6d55-49b7-a5f8-abf9a0d6a84f',
		}, 'callId');
		expect(result).toBe(false);
	});

	it('should return true for DELETE requests without an ID (trailing slash)', async () => {
		const result = await hitHarperAPITool.needsApproval(runContext, { method: 'DELETE', path: '/Resource/' }, 'callId');
		expect(result).toBe(true);
	});

	it('should return true for DELETE requests without an ID (no trailing slash)', async () => {
		const result = await hitHarperAPITool.needsApproval(runContext, { method: 'DELETE', path: '/Resource' }, 'callId');
		expect(result).toBe(true);
	});

	it('should return true for DELETE requests to root', async () => {
		const result = await hitHarperAPITool.needsApproval(runContext, { method: 'DELETE', path: '/' }, 'callId');
		expect(result).toBe(true);
	});

	it('should return true for DELETE requests to empty path', async () => {
		const result = await hitHarperAPITool.needsApproval(runContext, { method: 'DELETE', path: '' }, 'callId');
		expect(result).toBe(true);
	});
});
