import { existsSync } from 'node:fs';
import path, { dirname, join } from 'node:path';

/**
 * Walks up from startDir to find the nearest directory that contains a Harper app
 * configuration file: `config.yaml`.
 * Returns the directory path if found, otherwise null.
 */
export function findNearestHarperConfigDir(startDir: string): string | null {
	let dir = path.resolve(startDir);
	// Small safety to avoid infinite loops; stop at filesystem root
	let maxDepth = 10;
	while (true) {
		if (maxDepth-- <= 0) {
			return null;
		}
		const candidate = join(dir, 'config.yaml');
		if (existsSync(candidate)) {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) {
			return null;
		}
		dir = parent;
	}
}

/**
 * Resolves a provided session path against the nearest Harper app root (if any).
 * - Absolute paths (or paths starting with '~') are returned as-is.
 * - Relative paths are anchored to the closest directory up from `cwd` that
 *   contains a `config.yaml`.
 * - If none is found, they are resolved against the `originalCwd`.
 */
export function resolveSessionPathConsideringHarper(
	raw: string | null,
	cwd: string,
	originalCwd: string,
): string | null {
	if (!raw) {
		return null;
	}
	if (raw.startsWith('~') || path.isAbsolute(raw)) {
		return raw;
	}
	const harperRoot = findNearestHarperConfigDir(cwd);
	if (harperRoot) {
		return path.resolve(harperRoot, raw);
	}
	return path.resolve(originalCwd, raw);
}
