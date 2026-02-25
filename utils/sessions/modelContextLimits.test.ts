import { describe, expect, it } from 'vitest';
import { getCompactionTriggerTokens, getModelContextLimit } from './modelContextLimits';

describe('modelContextLimits', () => {
	describe('getModelContextLimit', () => {
		it('returns default limit for unknown/null/undefined models', () => {
			expect(getModelContextLimit(null)).toBe(128_000);
			expect(getModelContextLimit(undefined)).toBe(128_000);
			expect(getModelContextLimit('unknown-model')).toBe(128_000);
		});

		it('returns 200k for gpt-5, o1, o3, o4 family', () => {
			expect(getModelContextLimit('gpt-5')).toBe(200_000);
			expect(getModelContextLimit('gpt-5-mini')).toBe(200_000);
			expect(getModelContextLimit('o1-preview')).toBe(128_000);
			expect(getModelContextLimit('o3-mini')).toBe(128_000);
			expect(getModelContextLimit('o4-mini')).toBe(128_000);
		});

		it('returns 128k for gpt-4 family', () => {
			expect(getModelContextLimit('gpt-4o')).toBe(128_000);
			expect(getModelContextLimit('gpt-4.1')).toBe(128_000);
			expect(getModelContextLimit('gpt-4-turbo')).toBe(128_000);
		});

		it('returns 200k for claude-3 series', () => {
			expect(getModelContextLimit('claude-3.5-sonnet')).toBe(200_000);
			expect(getModelContextLimit('claude-3.7-sonnet')).toBe(200_000);
		});

		it('returns 1M for claude-4.5 and above', () => {
			expect(getModelContextLimit('claude-4.5')).toBe(1_000_000);
			expect(getModelContextLimit('claude-4.6')).toBe(1_000_000);
		});

		it('returns 1M for gemini-2.0 and gemini-1.5', () => {
			expect(getModelContextLimit('gemini-2.0-flash')).toBe(1_000_000);
			expect(getModelContextLimit('gemini-1.5-pro')).toBe(1_000_000);
		});

		it('returns 8k for ollama models', () => {
			expect(getModelContextLimit('ollama-llama3')).toBe(8_000);
		});
	});

	describe('getCompactionTriggerTokens', () => {
		it('applies default fraction of 0.5', () => {
			// gpt-4o is 128k. 128k * 0.5 = 64k.
			expect(getCompactionTriggerTokens('gpt-4o')).toBe(64_000);
		});

		it('applies custom fraction', () => {
			// gpt-4o is 128k. 128k * 0.8 = 102,400.
			expect(getCompactionTriggerTokens('gpt-4o', 0.8)).toBe(102_400);
		});

		it('clamps fraction between 0.5 and 0.95', () => {
			const limit = getModelContextLimit('gpt-4o'); // 128k
			expect(getCompactionTriggerTokens('gpt-4o', 0.1)).toBe(limit * 0.5);
			expect(getCompactionTriggerTokens('gpt-4o', 0.99)).toBe(Math.floor(limit * 0.95));
		});
	});
});
