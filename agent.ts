#!/usr/bin/env node
import 'dotenv/config';
import { Agent } from '@openai/agents';
import { render } from 'ink';
import React from 'react';
import { cleanUpAndSayBye } from './lifecycle/cleanUpAndSayBye';
import { getModel, isOpenAIModel } from './lifecycle/getModel';
import { handleExit } from './lifecycle/handleExit';
import { parseArgs } from './lifecycle/parseArgs';
import { sayHi } from './lifecycle/sayHi';
import { trackedState } from './lifecycle/trackedState';
import { createTools } from './tools/factory';
import { checkForUpdate } from './utils/package/checkForUpdate';
import { createSession } from './utils/sessions/createSession';
import { modelSettings } from './utils/sessions/modelSettings';
import { App } from './utils/shell/App';
import { ensureApiKey } from './utils/shell/ensureApiKey';

const argumentTruncationPoint = 100;

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

async function main() {
	await checkForUpdate();
	parseArgs();
	await ensureApiKey();

	const { name, instructions, info, welcomeMessage } = sayHi();

	const agent = new Agent({
		name,
		model: isOpenAIModel(trackedState.model) ? trackedState.model : getModel(trackedState.model),
		modelSettings,
		instructions,
		tools: createTools(),
	});
	const session = createSession(trackedState.sessionPath);

	const initialMessages: any[] = [
		...info.map(text => ({ type: 'info', text })),
		{ type: 'assistant', text: welcomeMessage },
	];

	render(React.createElement(App, { agent, session, initialMessages }));
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
