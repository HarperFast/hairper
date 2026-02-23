export type PlanItemStatus = 'todo' | 'in-progress' | 'done' | 'not-needed';

export interface PlanItem {
	id: number;
	text: string;
	status: PlanItemStatus;
}
