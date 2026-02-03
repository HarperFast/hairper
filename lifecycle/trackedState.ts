export interface TrackedState {
	atStartOfLine: boolean;
	emptyLines: number;
	approvalState: any | null;
	controller: AbortController | null;
	model: string;
	compactionModel: string;
	sessionPath: string | null;
	useFlexTier: boolean;
}

export const trackedState: TrackedState = {
	atStartOfLine: true,
	emptyLines: 0,
	approvalState: null,
	controller: null,
	model: '',
	compactionModel: '',
	sessionPath: null,
	useFlexTier: false,
};
