import * as fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isIgnored } from './aiignore.ts';

vi.mock('node:fs');

describe('isIgnored', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should ignore .aiignore even if there isn't a .aiignore in place", () => {
		vi.mocked(fs.existsSync).mockReturnValue(false);

		expect(isIgnored('.aiignore')).toBe(true);
		expect(isIgnored('./.aiignore')).toBe(true);
		expect(isIgnored('subdir/.aiignore')).toBe(true);
		expect(isIgnored('/absolute/path/to/.aiignore')).toBe(true);
		expect(isIgnored('.aiignore/somefile')).toBe(true);
		expect(isIgnored('subdir/.aiignore/somefile')).toBe(true);
	});

	it("should still ignore .aiignore even if the .aiignore file doesn't mention it", () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue('dist/\nnode_modules/');

		expect(isIgnored('.aiignore')).toBe(true);
	});

	it('should still ignore patterns from .aiignore file', () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue('dist/\nnode_modules/');

		expect(isIgnored('dist/index.js')).toBe(true);
		expect(isIgnored('src/index.js')).toBe(false);
	});
});
