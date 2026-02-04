vi.mock('node:child_process', () => ({
	execSync: vi.fn((command: any) => {
		if (typeof command === 'string' && command.startsWith('npm create harper')) {
			return 'created ok';
		}
		return Buffer.from('');
	}),
}));
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackedState } from '../../lifecycle/trackedState';
import { execute as createHarper } from './createNewHarperApplicationTool';

describe('createNewHarperApplicationTool', () => {
	const originalCwd = process.cwd();
	let baseDir: string;

	beforeEach(async () => {
		vi.restoreAllMocks();
		baseDir = path.join(originalCwd, `.tmp-create-app-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		await mkdir(baseDir, { recursive: true });
		process.chdir(baseDir);
		trackedState.cwd = baseDir;
	});

	afterEach(async () => {
		process.chdir(originalCwd);
		trackedState.cwd = originalCwd;
		await rm(baseDir, { recursive: true, force: true });
	});

	it('automatically switches cwd to the created directory', async () => {
		const appName = 'my-app';
		const resolved = path.join(baseDir, appName);
		await mkdir(resolved, { recursive: true }); // simulate a directory created by npm

		const result = await createHarper({ directoryName: appName, template: 'vanilla-ts' } as any);
		expect(result).toContain('Successfully created a new Harper application');
		expect(result).toContain('AGENTS.md');
		expect(process.cwd()).toBe(resolved);
		expect(trackedState.cwd).toBe(resolved);
	});
});
