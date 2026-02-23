import { tool } from '@openai/agents';
import { z } from 'zod';
import { globalPlanContext } from '../../ink/contexts/globalPlanContext';
import { emitToListeners } from '../../ink/emitters/listener';

const AddPlanItemParameters = z.object({
	text: z.string().describe('The description of the task or milestone to add to the plan.'),
});

export const addPlanItemTool = tool({
	name: 'add_plan_item',
	description: 'Add a new item to the plan.',
	parameters: AddPlanItemParameters,
	async execute({ text }: z.infer<typeof AddPlanItemParameters>) {
		const newItems = [
			...globalPlanContext.planItems,
			{
				id: globalPlanContext.planItems.length + 1,
				text,
				status: 'todo' as const,
			},
		];
		emitToListeners('SetPlanItems', newItems);
		return `Added plan item: ${text}`;
	},
});
