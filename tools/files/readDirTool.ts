import { tool } from 'ai';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod/v3';
import { isIgnored } from '../../utils/aiignore.ts';

export const readDirTool = tool({
	description: 'Lists the files in a directory.',
	inputSchema: z.object({
		directoryName: z.string().describe('The name of the directory to read.'),
	}),
	execute: async ({ directoryName }) => {
		try {
			const files = await readdir(directoryName, 'utf-8');
			const filtered = files.filter(file => !isIgnored(path.join(directoryName, file)));
			return filtered.join('\n');
		} catch (error) {
			return `Error reading directory: ${error}`;
		}
	},
});
