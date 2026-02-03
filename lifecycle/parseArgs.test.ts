import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseArgs } from './parseArgs';
import { trackedState } from './trackedState';

const ORIGINAL_ENV = { ...process.env } as Record<string, string | undefined>;
const ORIGINAL_ARGV = [...process.argv];

function resetState() {
	trackedState.atStartOfLine = true;
	trackedState.emptyLines = 0;
	trackedState.approvalState = null;
	trackedState.controller = null;
	trackedState.model = null;
	trackedState.compactionModel = null;
	trackedState.sessionPath = null;
	trackedState.useFlexTier = false;
}

function clearProviderEnv() {
	delete process.env.HAIRPER_MODEL;
	delete process.env.HAIRPER_COMPACTION_MODEL;
	delete process.env.HAIRPER_SESSION;
	delete process.env.HAIRPER_FLEX_TIER;

	delete process.env.OPENAI_API_KEY;
	delete process.env.ANTHROPIC_API_KEY;
	delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
	delete process.env.OLLAMA_BASE_URL;
}

describe('parseArgs defaults based on ENV provider keys', () => {
	beforeEach(() => {
		process.argv = ['node', 'agent.js'];
		// copy to avoid mutating ORIGINAL_ENV reference
		process.env = { ...ORIGINAL_ENV };
		clearProviderEnv();
		resetState();
	});

	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
		process.argv = [...ORIGINAL_ARGV];
		resetState();
	});

	it('prefers Anthropic when ANTHROPIC_API_KEY is present', () => {
		process.env.ANTHROPIC_API_KEY = 'sk-ant-123';
		parseArgs();
		expect(trackedState.model).toBe('claude-3-7-sonnet-latest');
		expect(trackedState.compactionModel).toBe('claude-3-5-haiku-latest');
	});

	it('uses Google default when GOOGLE_GENERATIVE_AI_API_KEY is present', () => {
		process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-gai-123';
		parseArgs();
		expect(trackedState.model).toBe('gemini-2.0-flash');
		expect(trackedState.compactionModel).toBe('gemini-1.5-flash');
	});

	it('uses OpenAI default when OPENAI_API_KEY is present', () => {
		process.env.OPENAI_API_KEY = 'sk-openai-123';
		parseArgs();
		expect(trackedState.model).toBe('gpt-5.2');
		expect(trackedState.compactionModel).toBe('gpt-4o-mini');
	});

	it('uses Ollama default when OLLAMA_BASE_URL is present', () => {
		process.env.OLLAMA_BASE_URL = 'http://localhost:11434/api';
		parseArgs();
		expect(trackedState.model).toBe('ollama-qwen3-coder:30b');
		expect(trackedState.compactionModel).toBe('ollama-qwen2.5-coder');
	});

	it('HAIRPER_MODEL explicit env should override provider defaults', () => {
		process.env.ANTHROPIC_API_KEY = 'sk-ant-123';
		process.env.HAIRPER_MODEL = 'gpt-4o';
		parseArgs();
		expect(trackedState.model).toBe('gpt-4o');
	});

	it('when multiple provider keys exist, Anthropic takes precedence over OpenAI and Google', () => {
		process.env.OPENAI_API_KEY = 'sk-openai-123';
		process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-gai-123';
		process.env.ANTHROPIC_API_KEY = 'sk-ant-123';
		parseArgs();
		expect(trackedState.model).toBe('claude-3-7-sonnet-latest');
	});
});
