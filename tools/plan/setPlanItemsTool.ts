import { tool } from '@openai/agents';
import { z } from 'zod';
import { emitToListeners } from '../../ink/emitters/listener';

const SetPlanItemsParameters = z.object({
	items: z.array(z.string()).describe('An array of task descriptions to set as the plan items.'),
});

export const setPlanItemsTool = tool({
	name: 'set_plan_items',
	description: 'Set multiple plan items at once, replacing any existing items.',
	parameters: SetPlanItemsParameters,
	async execute({ items }: z.infer<typeof SetPlanItemsParameters>) {
		const newItems = items.map((text, index) => ({
			id: index + 1,
			text,
			status: 'todo' as const,
		}));
		emitToListeners('SetPlanItems', newItems);
		return `Set ${newItems.length} plan items.`;
	},
});
