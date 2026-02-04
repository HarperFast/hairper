import type { ModelSettings } from '@openai/agents-core/model';
import { trackedState } from '../../lifecycle/trackedState';

export const modelSettings: ModelSettings = {
	parallelToolCalls: false,
	text: {
		verbosity: 'low',
	},
	providerData: {
		service_tier: trackedState.useFlexTier ? 'flex' : 'auto',
	},
};

export const compactionModelSettings: ModelSettings = {
	...modelSettings,
	text: {
		verbosity: 'medium',
	},
};
