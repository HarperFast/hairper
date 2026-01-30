import { tool } from 'ai';
import { execSync } from 'node:child_process';
import { z } from 'zod/v3';
import { isIgnored } from '../../utils/aiignore.ts';

export const egrepTool = tool({
	description: 'File pattern searcher.',
	inputSchema: z.object({
		path: z.string().describe('The path to start the search from.'),
		pattern: z.string().describe('The pattern to search'),
	}),
	execute: async ({ path, pattern }) => {
		try {
			const output = execSync(`egrep -ir "${pattern}" ${path}`).toString('utf8');
			return output
				.split('\n')
				.filter(line => {
					if (line.trim() === '') { return false; }
					// egrep output format is typically path:line_content
					const colonIndex = line.indexOf(':');
					if (colonIndex !== -1) {
						const filePath = line.substring(0, colonIndex);
						return !isIgnored(filePath);
					}
					return true;
				})
				.join('\n');
		} catch (error) {
			return `Error executing egrep command: ${error}`;
		}
	},
});
