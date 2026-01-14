import { tool } from '@openai/agents';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

const ToolParameters = z.object({});

export const getHarperSchemaGraphQLTool = tool({
	name: 'getHarperSchemaGraphQLTool',
	description:
		'Returns the GraphQL schema for HarperDB schema files, which define the structure of HarperDB database tables.',
	parameters: ToolParameters,
	async execute() {
		try {
			const filePath = path.join(process.cwd(), 'node_modules', 'harperdb', 'schema.graphql');
			return await readFile(filePath, 'utf-8');
		} catch (error) {
			return `Error reading HarperDB GraphQL schema: ${error}`;
		}
	},
});
