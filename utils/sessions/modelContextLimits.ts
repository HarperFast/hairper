// Lightweight model context limit mapper. Values are conservative defaults.
// When exact limits are unknown, we pick a safe fallback to avoid overfilling.

export function getModelContextLimit(modelName: string | undefined | null): number {
	if (!modelName) {
		return DEFAULT_LIMIT;
	}

	const name = modelName.toLowerCase();

	// OpenAI
	if (name.startsWith('gpt-')) {
		if (name.startsWith('gpt-4')) {
			return 128_000;
		}

		return 200_000; // typical 128k–200k; be safe
	}

	// Anthropic
	if (name.startsWith('claude-')) {
		if (name.startsWith('claude-3.7') || name.startsWith('claude-3.5') || name.startsWith('claude-3')) {
			return 200_000;
		}
		return 1_000_000;
	}

	// Google Gemini
	if (name.startsWith('gemini-')) {
		return 1_000_000;
	}

	if (name.startsWith('ollama-')) {
		// Ollama/local models often default to 4k–8k; use 8k as safe default
		return 8_000;
	}

	return DEFAULT_LIMIT;
}

export function getCompactionTriggerTokens(modelName: string | undefined | null, fraction = 0.5): number {
	const limit = getModelContextLimit(modelName);
	// Keep a healthy buffer to avoid provider-side rejections
	const f = Math.min(Math.max(fraction, 0.5), 0.95);
	return Math.floor(limit * f);
}

const DEFAULT_LIMIT = 128_000;
