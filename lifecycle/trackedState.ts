export interface TrackedState {
	cwd: string;
	atStartOfLine: boolean;
	emptyLines: number;
	approvalState: any | null;
	controller: AbortController | null;
	model: string;
	compactionModel: string;
	sessionPath: string | null;
	useFlexTier: boolean;
	disableSpinner: boolean;
	enableInterruptions: boolean; // whether stdin can interrupt model runs
}

export const trackedState: TrackedState = {
	cwd: process.cwd(),
	atStartOfLine: true,
	emptyLines: 0,
	approvalState: null,
	controller: null,
	model: '',
	compactionModel: '',
	sessionPath: null,
	useFlexTier: false,
	disableSpinner: false,
	enableInterruptions: true,
};
