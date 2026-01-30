import { tool } from 'ai';
import { readFile } from 'node:fs/promises';
import { z } from 'zod/v3';
import { isIgnored } from '../../utils/aiignore.ts';

export const readFileTool = tool({
	description: 'Reads the contents of a specified file.',
	inputSchema: z.object({
		fileName: z.string().describe('The name of the file to read.'),
	}),
	execute: async ({ fileName }) => {
		if (isIgnored(fileName)) {
			return `Error: Access to ${fileName} is restricted by .aiignore`;
		}
		try {
			return await readFile(fileName, 'utf-8');
		} catch (error) {
			return `Error reading file: ${error}`;
		}
	},
});
