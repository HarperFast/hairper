#!/usr/bin/env node
import 'dotenv/config';
import { streamText, type ModelMessage, stepCountIs } from 'ai';
import chalk from 'chalk';
import createDebug from 'debug';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createTools } from './tools/factory.ts';
import { askQuestion } from './utils/askQuestion.ts';
import { cleanUpAndSayBye } from './utils/cleanUpAndSayBye.ts';
import { ensureApiKey, getConfig, getModel } from './utils/config.ts';
import { harperResponse } from './utils/harperResponse.ts';
import { spinner } from './utils/spinner.ts';

const debug = createDebug('hairper:agent');

async function main() {
	const config = getConfig();
	debug('Starting hairper agent...');
	debug('Config loaded: %O', config);

	try {
		ensureApiKey(config);
	} catch (error) {
		harperResponse(chalk.red(`Error: ${(error as Error).message}`));
		console.log(`Please set it in your environment or in a ${chalk.cyan('.env')} file.`);
		process.exit(1);
	}

	const workspaceRoot = process.cwd();
	const harperAppExists = existsSync(join(workspaceRoot, 'config.yaml'));

	console.log(chalk.dim(`Working directory: ${chalk.cyan(workspaceRoot)}`));
	console.log(chalk.dim(`Harper app detected in it: ${chalk.cyan(harperAppExists ? 'Yes' : 'No')}`));
	console.log(chalk.dim(`Provider: ${chalk.cyan(config.provider)} | Model: ${chalk.cyan(config.model)}`));
	console.log(chalk.dim(`Press Ctrl+C or hit enter twice to exit.\n`));

	const vibing = harperAppExists ? 'updating' : 'creating';
	const systemPrompt = `You are working on ${vibing} the harper app in ${workspaceRoot} with the user.`;

	harperResponse(
		harperAppExists
			? 'What do you want to do together today?'
			: 'What kind of Harper app do you want to make together?',
	);

	const messages: ModelMessage[] = [];
	let emptyLines = 0;

	while (true) {
		const task = await askQuestion('> ');
		if (!task) {
			emptyLines += 1;
			if (emptyLines >= 2) {
				cleanUpAndSayBye();
				process.exit(0);
			}
			continue;
		}
		emptyLines = 0;

		messages.push({ role: 'user', content: task });

		debug('Starting streamText request...');
		debug('Config: %O', config);
		debug('Messages count: %d', messages.length);
		debug('Last message: %O', messages[messages.length - 1]);

		spinner.start();

		try {
			const result = streamText({
                model: getModel(config),
                system: systemPrompt,
                messages,
                tools: createTools(),
                stopWhen: stepCountIs(10),

                onStepFinish: ({ toolCalls }) => {
					if (toolCalls && toolCalls.length > 0) {
						for (const toolCall of toolCalls) {
							spinner.stop();
							// Handle both typed and dynamic tool calls
							const input = 'input' in toolCall ? toolCall.input : {};
							const args = JSON.stringify(input);
							const displayArgs = args.length <= 80 ? `(${args})` : '';
							console.log(`\n${chalk.yellow('🛠️')}  ${chalk.cyan(toolCall.toolName)}${chalk.dim(displayArgs)}`);
							spinner.start();
						}
					}
				}
            });

			debug('streamText returned, consuming textStream...');
			debug('Result object keys: %s', Object.keys(result).join(', '));

			// Try to get the full text to see if there's any content (async)
			(async () => {
				try {
					const text = await result.text;
					debug('Full text from promise: "%s" (length: %d)', text, text.length);
				} catch (e) {
					debug('Error getting full text: %O', e);
				}
			})();

			let hasStartedResponse = false;
			let fullResponse = '';
			let chunkCount = 0;

			for await (const chunk of result.textStream) {
				chunkCount++;
				if (chunkCount === 1) {
					debug('First chunk received');
				}
				spinner.stop();
				if (!hasStartedResponse) {
					process.stdout.write(`${chalk.bold('Harper:')} `);
					hasStartedResponse = true;
				}
				process.stdout.write(chalk.cyan(chunk));
				fullResponse += chunk;
			}

			debug('Stream finished, received %d chunks', chunkCount);
			debug('Full response length: %d', fullResponse.length);

			// Try to get additional metadata from the result
			try {
				const usage = await result.usage;
				debug('Token usage: %O', usage);
			} catch (e) {
				debug('Could not get usage: %O', e);
			}

			try {
				const finishReason = await result.finishReason;
				debug('Finish reason: %s', finishReason);
			} catch (e) {
				debug('Could not get finish reason: %O', e);
			}

			try {
				const toolCalls = await result.toolCalls;
				debug('Tool calls: %O', toolCalls);
			} catch (e) {
				debug('Could not get tool calls: %O', e);
			}

			try {
				const steps = await result.steps;
				debug('Steps count: %d', steps.length);
			} catch (e) {
				debug('Could not get steps: %O', e);
			}

			spinner.stop();

			if (hasStartedResponse) {
				process.stdout.write('\n\n');
			}

			// Add assistant response to conversation history
			if (fullResponse) {
				messages.push({ role: 'assistant', content: fullResponse });
			} else {
				debug('Warning: No response content received');
			}
		} catch (error) {
			spinner.stop();
			const err = error as Error;
			harperResponse(chalk.red(`Error: ${err.message}`));
			debug('Full error: %O', err);
			console.log('');
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
