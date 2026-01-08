import {tool} from '@openai/agents';
import {readdir} from 'node:fs/promises';
import {z} from 'zod';

const ToolParameters = z.object({
	directoryName: z
		.string()
		.describe('The name of the directory to read.'),
});

export const readDirTool = tool({
	name: 'readDir',
	description:
		'Lists the files in a directory.',
	parameters: ToolParameters,
	async execute({directoryName}: z.infer<typeof ToolParameters>) {
		try {
			return readdir(directoryName, 'utf-8');
		} catch (error) {
			return `Error reading directory: ${error}`;
		}
	},
});
