import { tool } from 'ai';
import { z } from 'zod/v3';
import { harperProcess } from '../../utils/harperProcess.ts';

export const readHarperOpenAPISpecTool = tool({
	description: 'Reads the OpenAPI spec of a started Harper app.',
	inputSchema: z.object({}),
	execute: async () => {
		try {
			if (!harperProcess.running) {
				return `Error: No Harper application is currently running.`;
			}

			// TODO: Auth...
			// TODO: Figure out port.
			const response = await fetch('http://localhost:9962/openapi/');
			if (!response.ok) {
				return `Error: Failed to download template: ${response.statusText} (${response.status})`;
			}
			return await response.text();
			// TODO: If not started, return an error string.
		} catch (error) {
			return `Error getting OpenAPI spec from Harper app: ${error}`;
		}
	},
});
