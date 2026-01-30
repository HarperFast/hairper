import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { type LanguageModel } from 'ai';
import { createOllama } from 'ai-sdk-ollama';

export type ProviderName = 'openai' | 'anthropic' | 'google' | 'ollama';

export interface Config {
	provider: ProviderName;
	model: string;
}

const DEFAULT_MODELS: Record<ProviderName, string> = {
	openai: 'gpt-4o',
	anthropic: 'claude-sonnet-4-20250514',
	google: 'gemini-2.0-flash',
	ollama: 'llama3.1',
};

export function getConfig(): Config {
	const provider = (process.env['HAIRPER_PROVIDER'] || 'openai') as ProviderName;
	const model = process.env['HAIRPER_MODEL'] || DEFAULT_MODELS[provider];

	return { provider, model };
}

export function getModel(config: Config): LanguageModel {
	const { provider, model } = config;

	switch (provider) {
		case 'openai':
			return openai(model);
		case 'anthropic':
			return anthropic(model);
		case 'google':
			return google(model);
		case 'ollama': {
			const baseURL = process.env['OLLAMA_BASE_URL'];
			const ollamaProvider = baseURL ? createOllama({ baseURL }) : createOllama();
			return ollamaProvider(model);
		}
		default:
			throw new Error(`Unknown provider: ${provider}`);
	}
}

export function getProviderApiKeyEnvVar(provider: ProviderName): string | null {
	switch (provider) {
		case 'openai':
			return 'OPENAI_API_KEY';
		case 'anthropic':
			return 'ANTHROPIC_API_KEY';
		case 'google':
			return 'GOOGLE_GENERATIVE_AI_API_KEY';
		case 'ollama':
			return null; // Ollama is local, no API key needed
		default:
			return null;
	}
}

export function ensureApiKey(config: Config): void {
	const envVar = getProviderApiKeyEnvVar(config.provider);

	if (envVar && !process.env[envVar]) {
		throw new Error(
			`${envVar} is not set. Please set it in your environment or in a .env file.`,
		);
	}
}
