import { resolveSessionPathConsideringHarper } from '../utils/files/harperApp';

export interface TrackedState {
	originalCwd: string;
	cwd: string;
	model: string;
	compactionModel: string;
	originalSessionPath: string | null;
	sessionPath: string | null;
	useFlexTier: boolean;
	maxTurns: number;
	maxCost: number | null;
	autoApproveCodeInterpreter: boolean;
	autoApprovePatches: boolean;
	autoApproveShell: boolean;
	monitorRateLimits: boolean;
	rateLimitThreshold: number;
}
export const trackedState: TrackedState = {
	originalCwd: process.cwd(),
	cwd: process.cwd(),
	model: '',
	compactionModel: '',
	originalSessionPath: null,

	get sessionPath() {
		return resolveSessionPathConsideringHarper(trackedState.originalSessionPath, this.cwd, this.originalCwd);
	},
	set sessionPath(value: string | null) {
		trackedState.originalSessionPath = value;
	},

	useFlexTier: false,
	maxTurns: 30,
	maxCost: null,
	autoApproveCodeInterpreter: false,
	autoApprovePatches: false,
	autoApproveShell: false,
	monitorRateLimits: true,
	rateLimitThreshold: 80,
};
