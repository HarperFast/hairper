import { deleteFileTool, editFileTool, writeFileTool } from './files/applyPatchTool.ts';
import { egrepTool } from './files/egrepTool.ts';
import { findTool } from './files/findTool.ts';
import { readDirTool } from './files/readDirTool.ts';
import { readFileTool } from './files/readFileTool.ts';
import { shellTool } from './general/shell.ts';
import { createNewHarperApplicationTool } from './harper/createNewHarperApplicationTool.ts';
import { openBrowserTool } from './harper/openBrowserTool.ts';
import { readHarperLogsTool } from './harper/readHarperLogsTool.ts';
import { readHarperOpenAPISpecTool } from './harper/readHarperOpenAPISpecTool.ts';
import { startHarperTool } from './harper/startHarperTool.ts';
import { stopHarperTool } from './harper/stopHarperTool.ts';

export function createTools() {
	return {
		// File operations
		readFile: readFileTool,
		readDir: readDirTool,
		find: findTool,
		egrep: egrepTool,
		writeFile: writeFileTool,
		editFile: editFileTool,
		deleteFile: deleteFileTool,

		// Shell
		shell: shellTool,

		// Harper application management
		createNewHarperApplication: createNewHarperApplicationTool,
		startHarper: startHarperTool,
		stopHarper: stopHarperTool,
		readHarperLogs: readHarperLogsTool,
		readHarperOpenAPISpec: readHarperOpenAPISpecTool,
		openBrowser: openBrowserTool,
	};
}
