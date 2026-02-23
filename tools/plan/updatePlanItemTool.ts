import { tool } from '@openai/agents';
import { z } from 'zod';
import { globalPlanContext } from '../../ink/contexts/globalPlanContext';
import { emitToListeners } from '../../ink/emitters/listener';

const UpdatePlanItemParameters = z.object({
	id: z.number().describe('The ID of the plan item to update.'),
	text: z.string().describe('The new description of the task.'),
	status: z.enum(['unchanged', 'todo', 'in-progress', 'done', 'not-needed']).describe(
		'The new status of the task.',
	),
});

export const updatePlanItemTool = tool({
	name: 'update_plan_item',
	description: 'Update an existing plan item.',
	parameters: UpdatePlanItemParameters,
	async execute({ id, text, status }: z.infer<typeof UpdatePlanItemParameters>) {
		const newItems = globalPlanContext.planItems.map(item => {
			if (item.id === id) {
				return {
					...item,
					text: text || item.text,
					status: status && status !== 'unchanged' ? status : item.status,
				};
			}
			return item;
		});

		const itemExists = globalPlanContext.planItems.some(item => item.id === id);
		if (!itemExists) {
			return `Error: Plan item with ID ${id} not found.`;
		}

		emitToListeners('SetPlanItems', newItems);
		return `Updated plan item ${id}`;
	},
});
