import { tool } from 'ai';
import { execSync } from 'node:child_process';
import { z } from 'zod/v3';
import { isIgnored } from '../../utils/aiignore.ts';

export const findTool = tool({
	description: 'Walk a file hierarchy.',
	inputSchema: z.object({
		path: z.string().describe('The path to start the search from.'),
		iname: z.string().describe(
			'Case insensitive, true if the last component of the pathname being examined matches pattern.  Special shell pattern matching characters ("[", "]", "*", and "?") may be used as part of pattern.  These characters may be matched explicitly by escaping them with a backslash ("\\").',
		),
	}),
	execute: async ({ path, iname }) => {
		try {
			const output = execSync(`find ${path} -iname '${iname}'`).toString('utf8');
			return output
				.split('\n')
				.filter(line => line.trim() !== '' && !isIgnored(line))
				.join('\n');
		} catch (error) {
			return `Error executing find command: ${error}`;
		}
	},
});
