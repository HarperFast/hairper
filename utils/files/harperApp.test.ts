import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findNearestHarperConfigDir, resolveSessionPathConsideringHarper } from './harperApp';

describe('utils/files/harperApp', () => {
	let tmpRoot: string;

	beforeEach(() => {
		tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'harper-app-util-'));
	});

	afterEach(() => {
		rmSync(tmpRoot, { recursive: true, force: true });
	});

	describe('findNearestHarperConfigDir', () => {
		it('returns nearest ancestor directory containing config.yaml', () => {
			const root = path.join(tmpRoot, 'root');
			const app = path.join(root, 'app');
			const nested = path.join(app, 'nested', 'inner');
			mkdirSync(nested, { recursive: true });
			// Place config at app level, not root
			writeFileSync(path.join(app, 'config.yaml'), 'name: test-app\n');

			const found = findNearestHarperConfigDir(nested);
			expect(found).toBe(path.resolve(app));
		});

		it('returns null when no config.yaml exists up the tree', () => {
			const nested = path.join(tmpRoot, 'no', 'config', 'here');
			mkdirSync(nested, { recursive: true });
			const found = findNearestHarperConfigDir(nested);
			expect(found).toBeNull();
		});

		it('prefers nearest when multiple ancestors have config.yaml', () => {
			const top = path.join(tmpRoot, 'top');
			const mid = path.join(top, 'mid');
			const leaf = path.join(mid, 'leaf');
			mkdirSync(leaf, { recursive: true });
			writeFileSync(path.join(top, 'config.yaml'), 'name: top\n');
			writeFileSync(path.join(mid, 'config.yaml'), 'name: mid\n');

			const found = findNearestHarperConfigDir(path.join(leaf));
			expect(found).toBe(path.resolve(mid));
		});
	});

	describe('resolveSessionPathConsideringHarper', () => {
		it('returns null when raw is null', () => {
			const result = resolveSessionPathConsideringHarper(null, tmpRoot, tmpRoot);
			expect(result).toBeNull();
		});

		it('returns absolute paths and tilde-prefixed paths unchanged', () => {
			const abs = path.resolve(tmpRoot, 'abs.json');
			const tilde = '~/home.json';
			expect(resolveSessionPathConsideringHarper(abs, tmpRoot, tmpRoot)).toBe(abs);
			expect(resolveSessionPathConsideringHarper(tilde, tmpRoot, tmpRoot)).toBe(tilde);
		});

		it('anchors relative raw to nearest Harper root from cwd when present', () => {
			const app = path.join(tmpRoot, 'app');
			const inner = path.join(app, 'x', 'y');
			mkdirSync(inner, { recursive: true });
			writeFileSync(path.join(app, 'config.yaml'), 'name: app\n');

			const raw = 'sessions/s.json';
			const result = resolveSessionPathConsideringHarper(raw, inner, tmpRoot);
			expect(result).toBe(path.resolve(app, raw));
		});

		it('falls back to originalCwd when no Harper root is found from cwd', () => {
			const proj = path.join(tmpRoot, 'project');
			const work = path.join(proj, 'work');
			mkdirSync(work, { recursive: true });
			const raw = 'rel/file.json';
			const result = resolveSessionPathConsideringHarper(raw, work, proj);
			expect(result).toBe(path.resolve(proj, raw));
		});

		it('chooses the nearest of multiple Harper roots', () => {
			const top = path.join(tmpRoot, 'top');
			const mid = path.join(top, 'mid');
			const leaf = path.join(mid, 'leaf');
			mkdirSync(leaf, { recursive: true });
			writeFileSync(path.join(top, 'config.yaml'), 'name: top\n');
			writeFileSync(path.join(mid, 'config.yaml'), 'name: mid\n');

			const raw = 's.json';
			const result = resolveSessionPathConsideringHarper(raw, leaf, tmpRoot);
			expect(result).toBe(path.resolve(mid, raw));
		});
	});
});
