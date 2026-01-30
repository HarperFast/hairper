import { tool } from 'ai';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod/v3';
import { isIgnored } from '../../utils/aiignore.ts';
import { promptApplyPatchApproval } from '../../utils/promptApplyPatchApproval.ts';

const workspaceRoot = process.cwd();

function resolve(relativePath: string): string {
	if (isIgnored(relativePath)) {
		throw new Error(`Operation restricted by .aiignore: ${relativePath}`);
	}
	const resolved = path.resolve(workspaceRoot, relativePath);
	if (!resolved.startsWith(workspaceRoot)) {
		throw new Error(`Operation outside workspace: ${relativePath}`);
	}
	return resolved;
}

export const writeFileTool = tool({
	description:
		'Creates or updates a file with the provided content. Use this to write new files or completely replace existing file contents.',
	inputSchema: z.object({
		filePath: z.string().describe('The path to the file to create or update'),
		content: z.string().describe('The full content to write to the file'),
	}),
	execute: async ({ filePath, content }) => {
		const operation = {
			type: 'write_file',
			path: filePath,
			diff: content.length > 500 ? content.substring(0, 500) + '...' : content,
		};

		const approved = await promptApplyPatchApproval(operation);
		if (!approved) {
			return 'File write cancelled by user.';
		}

		try {
			const targetPath = resolve(filePath);
			await mkdir(path.dirname(targetPath), { recursive: true });
			await writeFile(targetPath, content, 'utf8');
			return `Successfully wrote to ${filePath}`;
		} catch (error) {
			return `Error writing file: ${error}`;
		}
	},
});

export const deleteFileTool = tool({
	description: 'Deletes a file from the filesystem.',
	inputSchema: z.object({
		filePath: z.string().describe('The path to the file to delete'),
	}),
	execute: async ({ filePath }) => {
		const operation = { type: 'delete_file', path: filePath };

		const approved = await promptApplyPatchApproval(operation);
		if (!approved) {
			return 'File deletion cancelled by user.';
		}

		try {
			const targetPath = resolve(filePath);
			await rm(targetPath, { force: true });
			return `Successfully deleted ${filePath}`;
		} catch (error) {
			return `Error deleting file: ${error}`;
		}
	},
});

export const editFileTool = tool({
	description:
		'Edits a file by replacing a specific string with new content. Use this for targeted changes to existing files.',
	inputSchema: z.object({
		filePath: z.string().describe('The path to the file to edit'),
		oldContent: z.string().describe('The exact content to find and replace'),
		newContent: z.string().describe('The content to replace it with'),
	}),
	execute: async ({ filePath, oldContent, newContent }) => {
		try {
			const targetPath = resolve(filePath);
			const original = await readFile(targetPath, 'utf8');

			if (!original.includes(oldContent)) {
				return `Error: Could not find the specified content in ${filePath}`;
			}

			const operation = {
				type: 'edit_file',
				path: filePath,
				diff: `Replace:\n${oldContent.substring(0, 200)}${oldContent.length > 200 ? '...' : ''}\nWith:\n${newContent.substring(0, 200)}${newContent.length > 200 ? '...' : ''}`,
			};

			const approved = await promptApplyPatchApproval(operation);
			if (!approved) {
				return 'File edit cancelled by user.';
			}

			const updated = original.replace(oldContent, newContent);
			await writeFile(targetPath, updated, 'utf8');
			return `Successfully edited ${filePath}`;
		} catch (error) {
			return `Error editing file: ${error}`;
		}
	},
});
