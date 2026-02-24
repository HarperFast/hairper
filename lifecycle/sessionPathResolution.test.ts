import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { trackedState } from './trackedState';

describe('trackedState.sessionPath dynamic resolution relative to Harper app', () => {
	const ORIGINAL_CWD = process.cwd();
	const ORIGINAL = { ...trackedState };
	let tmpRoot: string;

	beforeEach(() => {
		tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'harper-agent-sp-'));
	});

	afterEach(() => {
		try {
			process.chdir(ORIGINAL_CWD);
		} catch {}
		// reset trackedState fields potentially touched
		trackedState.model = '';
		trackedState.compactionModel = '';
		trackedState.originalSessionPath = null;
		trackedState.useFlexTier = false;
		trackedState.maxTurns = 30;
		trackedState.maxCost = null;
		trackedState.autoApproveCodeInterpreter = false;
		trackedState.autoApprovePatches = false;
		trackedState.autoApproveShell = false;
		trackedState.monitorRateLimits = true;
		trackedState.rateLimitThreshold = 80;
		trackedState.cwd = ORIGINAL.cwd;
		trackedState.originalCwd = ORIGINAL.originalCwd;
		rmSync(tmpRoot, { recursive: true, force: true });
	});

	it('anchors a relative sessionPath to the nearest parent directory containing config.yaml', () => {
		// Create structure: tmpRoot/app/config.yaml and tmpRoot/app/nested/inner
		const appDir = path.join(tmpRoot, 'app');
		const innerDir = path.join(appDir, 'nested', 'inner');
		mkdirSync(innerDir, { recursive: true });
		writeFileSync(path.join(appDir, 'config.yaml'), 'name: test-app\n');

		// Pretend we are in innerDir
		trackedState.cwd = innerDir;
		// Provide a relative session file path
		trackedState.sessionPath = 'sessions/my.json';

		expect(trackedState.sessionPath).toBe(path.resolve(appDir, 'sessions/my.json'));
	});

	it('falls back to resolving relative to originalCwd when no config.yaml exists up-tree', () => {
		const proj = path.join(tmpRoot, 'proj');
		const work = path.join(proj, 'work');
		mkdirSync(work, { recursive: true });

		// Simulate that the original CLI was launched from proj, then we cd into work
		trackedState.originalCwd = proj;
		trackedState.cwd = work;
		trackedState.sessionPath = 'a/b/c.json';

		expect(trackedState.sessionPath).toBe(path.resolve(proj, 'a/b/c.json'));
	});

	it('re-evaluates when trackedState.cwd changes (e.g., after changeCwd tool)', () => {
		const rootA = path.join(tmpRoot, 'A');
		const rootB = path.join(tmpRoot, 'B');
		const innerA = path.join(rootA, 'x', 'y');
		const innerB = path.join(rootB, 'm', 'n');
		mkdirSync(innerA, { recursive: true });
		mkdirSync(innerB, { recursive: true });
		writeFileSync(path.join(rootA, 'config.yaml'), 'name: app-A\n');
		writeFileSync(path.join(rootB, 'config.yaml'), 'name: app-B\n');

		trackedState.sessionPath = 's.json';
		trackedState.cwd = innerA;
		const first = trackedState.sessionPath;
		expect(first).toBe(path.resolve(rootA, 's.json'));

		// Simulate changing working directory via tool which updates trackedState.cwd
		trackedState.cwd = innerB;
		const second = trackedState.sessionPath;
		expect(second).toBe(path.resolve(rootB, 's.json'));
	});
});
