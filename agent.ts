#!/usr/bin/env /Users/dawson/.nvm/versions/node/v24.11.1/bin/node
import 'dotenv/config';
import { Agent, MemorySession, run } from '@openai/agents';
import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createTools } from './tools/factory.ts';
import { askQuestion } from './utils/askQuestion.ts';
import { cleanUpAndSayBye } from './utils/cleanUpAndSayBye.ts';
import { harperResponse } from './utils/harperResponse.ts';
import { spinner } from './utils/spinner.ts';

const MODEL_PRICES: Record<string, { input: number; output: number }> = {
	'gpt-4o': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
	'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
	'o1': { input: 15.00 / 1_000_000, output: 60.00 / 1_000_000 },
	'o1-mini': { input: 1.10 / 1_000_000, output: 4.40 / 1_000_000 },
	'gpt-5.2': { input: 10.00 / 1_000_000, output: 30.00 / 1_000_000 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
	const prices = MODEL_PRICES[model] || MODEL_PRICES['gpt-4o']!;
	return inputTokens * prices.input + outputTokens * prices.output;
}

async function main() {
	if (!process.env['OPENAI_API_KEY']) {
		harperResponse(chalk.red('Error: OPENAI_API_KEY is not set.'));
		console.log(`Please set it in your environment or in a ${chalk.cyan('.env')} file.`);
		process.exit(1);
	}

	const workspaceRoot = process.cwd();
	const harperAppExists = existsSync(join(workspaceRoot, 'config.yaml'));

	let totalInputTokens = 0;
	let totalOutputTokens = 0;
	let totalCost = 0;

	console.log(chalk.dim(`Working directory: ${chalk.cyan(workspaceRoot)}`));
	console.log(chalk.dim(`Harper app detected in it: ${chalk.cyan(harperAppExists ? 'Yes' : 'No')}`));
	console.log(chalk.dim(`Press Ctrl+C or hit enter twice to exit.\n`));

	const vibing = harperAppExists ? 'updating' : 'creating';
	const agent = new Agent({
		name: 'Harper App Development Assistant',
		model: 'gpt-5.2',
		instructions: `You are working on ${vibing} the harper app in ${workspaceRoot} with the user.`,
		tools: createTools(),
	});

	harperResponse(
		harperAppExists
			? 'What do you want to do together today?'
			: 'What kind of Harper app do you want to make together?',
	);

	const session = new MemorySession();
	let emptyLines = 0;
	let approvalState: any | null = null;

	let controller: AbortController | null = null;

	spinner.interrupt = () => {
		if (controller) {
			spinner.stop();
			controller.abort();
			harperResponse('<thought interrupted>');
		}
	};

	while (true) {
		let task: string = '';

		controller = new AbortController();
		const signal = controller.signal;

		if (!approvalState) {
			task = await askQuestion('> ');
			if (!task) {
				emptyLines += 1;
				if (emptyLines >= 2) {
					if (totalInputTokens > 0 || totalOutputTokens > 0) {
						console.log(
							chalk.dim(
								`Final session usage: ${chalk.cyan(totalInputTokens)} input, ${
									chalk.cyan(totalOutputTokens)
								} output tokens. Total cost: ${chalk.cyan('$' + totalCost.toFixed(4))}`,
							),
						);
					}
					cleanUpAndSayBye();
					break;
				}
				continue;
			}
			emptyLines = 0;

			process.stdout.write('\n');
		}

		spinner.start();

		const stream = await run(agent, approvalState ?? task, {
			session,
			stream: true,
			signal,
		});
		approvalState = null;

		let hasStartedResponse = false;
		let atStartOfLine = true;

		for await (const event of stream) {
			const usage = stream.state.usage;
			const modelName = typeof agent.model === 'string' ? agent.model : 'gpt-4o';
			const turnCost = calculateCost(modelName, usage.inputTokens, usage.outputTokens);
			spinner.status = chalk.dim(
				`[Tokens: ${chalk.cyan(usage.inputTokens)} in, ${chalk.cyan(usage.outputTokens)} out | Cost: ${
					chalk.cyan('$' + turnCost.toFixed(4))
				} (Total: ${chalk.cyan('$' + (totalCost + turnCost).toFixed(4))})]`,
			);

			switch (event.type) {
				case 'raw_model_stream_event':
					const data = event.data;
					switch (data.type) {
						case 'response_started':
							if (!atStartOfLine) {
								process.stdout.write('\n');
								atStartOfLine = true;
							}
							spinner.start();
							break;
						case 'output_text_delta':
							spinner.stop();
							if (!hasStartedResponse) {
								process.stdout.write(`${chalk.bold('Harper:')} `);
								hasStartedResponse = true;
							}
							process.stdout.write(chalk.cyan(data.delta));
							atStartOfLine = data.delta.endsWith('\n');
							break;
						case 'response_done':
							spinner.stop();
							atStartOfLine = true;
							break;
					}
					break;
				case 'agent_updated_stream_event':
					spinner.stop();
					console.log(`\n${chalk.magenta('👤')} ${chalk.bold('Agent switched to:')} ${chalk.italic(event.agent.name)}`);
					atStartOfLine = true;
					spinner.start();
					break;
				case 'run_item_stream_event':
					if (event.name === 'tool_called') {
						spinner.stop();
						const item = event.item.rawItem ?? event.item;
						const name = item.name || item.type || 'tool';
						const args: string = typeof item.arguments === 'string'
							? item.arguments
							: item.arguments
							? JSON.stringify(item.arguments)
							: '';
						const displayedArgs = args ? `(${args.slice(0, 50)}${args.length > 50 ? '...' : ''})` : '()';
						console.log(`\n${chalk.yellow('🛠️')}  ${chalk.cyan(name)}${chalk.dim(displayedArgs)}`);
						atStartOfLine = true;
						spinner.start();
					}
					break;
			}

			if (stream.interruptions?.length) {
				for (const interruption of stream.interruptions) {
					if (interruption.rawItem.type !== 'function_call') {
						throw new Error(
							'Invalid interruption type: ' + interruption.rawItem.type,
						);
					}

					spinner.stop();

					console.log(
						chalk.bold.bgYellow.black('\nTool approval required (see above):'),
					);

					const answer = await askQuestion(`\tProceed? [y/N] `);
					const approved = answer.trim().toLowerCase();

					spinner.start();

					const ok = approved === 'y' || approved === 'yes' || approved === 'ok' || approved === 'k';
					if (ok) {
						stream.state.approve(interruption);
					} else {
						stream.state.reject(interruption);
					}
				}
				approvalState = stream.state;
				break;
			}
		}
		spinner.stop();
		if (!atStartOfLine || hasStartedResponse) {
			process.stdout.write('\n\n');
		}

		if (!approvalState) {
			const usage = stream.state.usage;
			const modelName = typeof agent.model === 'string' ? agent.model : 'gpt-4o';
			const turnCost = calculateCost(modelName, usage.inputTokens, usage.outputTokens);

			totalInputTokens += usage.inputTokens;
			totalOutputTokens += usage.outputTokens;
			totalCost += turnCost;
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
