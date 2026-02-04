import { Agent, run } from '@openai/agents';
import chalk from 'chalk';
import { Box, Text, useApp, useInput } from 'ink';
import SpinnerImport from 'ink-spinner';
import TextInputImport from 'ink-text-input';
import React, { useEffect, useState } from 'react';
import { cleanUpAndSayBye } from '../../lifecycle/cleanUpAndSayBye';
import { trackedState } from '../../lifecycle/trackedState';
import { costTracker } from '../sessions/cost';

const TextInput = (TextInputImport as any).default || TextInputImport;
const Spinner = (SpinnerImport as any).default || SpinnerImport;

const argumentTruncationPoint = 100;

interface Message {
	type: 'user' | 'assistant' | 'info' | 'tool' | 'agent_switch';
	text: string;
	toolArgs?: string;
}

interface AppProps {
	agent: Agent;
	session: any;
	initialMessages: Message[];
}

export const App: React.FC<AppProps> = ({ agent, session, initialMessages }) => {
	const { exit } = useApp();
	const [messages, setMessages] = useState<Message[]>(initialMessages);
	const [input, setInput] = useState('');
	const [isThinking, setIsThinking] = useState(false);
	const [currentResponse, setCurrentResponse] = useState('');
	const [emptyLines, setEmptyLines] = useState(0);
	const [status, setStatus] = useState(() =>
		costTracker.getStatusString(
			undefined,
			trackedState.model || 'gpt-5.2',
			trackedState.compactionModel || 'gpt-4o-mini',
		)
	);
	const [approvalInterruption, setApprovalInterruption] = useState<any>(null);

	const handleSubmit = async (query: string) => {
		if (!query) {
			setEmptyLines((prev) => prev + 1);
			if (emptyLines + 1 >= 2) {
				handleExit();
			}
			return;
		}
		setEmptyLines(0);
		setMessages((prev) => [...prev, { type: 'user', text: query }]);
		setInput('');
		setIsThinking(true);
		setCurrentResponse('');

		await processTask(query);
	};

	const processTask = async (taskOrState: string | any) => {
		let lastToolCallInfo: string | null = null;
		let hasStartedResponse = false;

		try {
			trackedState.controller = new AbortController();
			const stream = await run(agent, taskOrState, {
				session,
				stream: true,
				signal: trackedState.controller.signal,
				maxTurns: 30,
			});
			trackedState.approvalState = null;

			let fullResponse = '';
			for await (const event of stream) {
				switch (event.type) {
					case 'raw_model_stream_event':
						const data = event.data;
						switch (data.type) {
							case 'response_started':
								setIsThinking(true);
								break;
							case 'output_text_delta':
								setIsThinking(false);
								hasStartedResponse = true;
								fullResponse += data.delta;
								setCurrentResponse(fullResponse);
								break;
							case 'response_done':
								setIsThinking(false);
								break;
						}
						break;
					case 'agent_updated_stream_event':
						setMessages((prev) => [...prev, { type: 'agent_switch', text: event.agent.name }]);
						break;
					case 'run_item_stream_event':
						if (event.name === 'tool_called') {
							const item: any = event.item.rawItem ?? event.item;
							const name = item.name || item.type || 'tool';
							let args: string = typeof item.arguments === 'string'
								? item.arguments
								: item.arguments
								? JSON.stringify(item.arguments)
								: '';

							if (!args && item.type === 'shell_call' && item.action?.commands) {
								args = JSON.stringify(item.action.commands);
							}

							if (!args && item.type === 'apply_patch_call' && item.operation) {
								args = JSON.stringify(item.operation);
							}

							const displayedArgs = args
								? `(${args.slice(0, argumentTruncationPoint)}${args.length > argumentTruncationPoint ? '...' : ''})`
								: '()';
							setMessages((prev) => [...prev, { type: 'tool', text: name, toolArgs: displayedArgs }]);
							lastToolCallInfo = `${name}${displayedArgs}`;
						}
						break;
				}

				setStatus(costTracker.getStatusString(
					stream.state.usage,
					trackedState.model || 'gpt-5.2',
					trackedState.compactionModel || 'gpt-4o-mini',
				));
			}

			if (hasStartedResponse) {
				setMessages((prev) => [...prev, { type: 'assistant', text: fullResponse }]);
				setCurrentResponse('');
			}

			if (stream.interruptions?.length) {
				setApprovalInterruption({ stream, interruption: stream.interruptions[0] });
			} else {
				if (!trackedState.approvalState) {
					costTracker.recordTurn(
						trackedState.model || 'gpt-5.2',
						stream.state.usage,
						trackedState.compactionModel || 'gpt-4o-mini',
					);
					setStatus(costTracker.getStatusString(
						undefined,
						trackedState.model || 'gpt-5.2',
						trackedState.compactionModel || 'gpt-4o-mini',
					));
				}
			}
		} catch (error: any) {
			const err: any = error ?? {};
			const name = err.name || 'Error';
			const message: string = err.message || String(err);
			const code = err.code ? ` code=${err.code}` : '';
			const status = err.status || err.statusCode || err.response?.status;
			const statusStr = status ? ` status=${status}` : '';
			const composed = `${name}:${code}${statusStr} ${message}`;
			setMessages((prev) => [...prev, { type: 'info', text: chalk.red(composed) }]);
		} finally {
			setIsThinking(false);
		}
	};

	const handleApproval = async (approved: boolean) => {
		const { stream, interruption } = approvalInterruption;
		setApprovalInterruption(null);
		if (approved) {
			stream.state.approve(interruption);
		} else {
			stream.state.reject(interruption);
		}
		trackedState.approvalState = stream.state;
		await processTask(stream.state);
	};

	const handleExit = async () => {
		exit();
		await cleanUpAndSayBye();
		process.exit(0);
	};

	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			handleExit();
		}
	});

	return (
		<Box flexDirection="column" width="100%">
			{status && (
				<Box position="absolute" right={0} top={0}>
					<Text>{status}</Text>
				</Box>
			)}
			{messages.map((msg, index) => (
				<Box key={index} flexDirection="column">
					{msg.type === 'user' && (
						<Box>
							<Text bold color="green">{'> '}</Text>
							<Text>{msg.text}</Text>
						</Box>
					)}
					{msg.type === 'assistant' && (
						<Box>
							<Text bold>Harper:</Text>
							<Text color="cyan">{msg.text}</Text>
						</Box>
					)}
					{msg.type === 'tool' && (
						<Box>
							<Text color="yellow">🛠️</Text>
							<Text color="cyan">{msg.text}</Text>
							<Text dimColor>{msg.toolArgs}</Text>
						</Box>
					)}
					{msg.type === 'agent_switch' && (
						<Box>
							<Text color="magenta">👤</Text>
							<Text bold>Agent switched to:</Text>
							<Text italic>{msg.text}</Text>
						</Box>
					)}
					{msg.type === 'info' && <Text>{msg.text}</Text>}
				</Box>
			))}
			{currentResponse && (
				<Box flexDirection="row">
					<Text bold>Harper:</Text>
					<Text color="cyan">{currentResponse}</Text>
				</Box>
			)}
			{approvalInterruption && (
				<Box flexDirection="column">
					<Text bold backgroundColor="yellow" color="black">Tool approval required (see above):</Text>
					<Box flexDirection="row">
						<Text>Proceed? [y/N]</Text>
						<TextInput
							value={input}
							onChange={setInput}
							onSubmit={(val) => {
								const approved = val.trim().toLowerCase();
								const ok = approved === 'y' || approved === 'yes' || approved === 'ok' || approved === 'k';
								setInput('');
								handleApproval(ok);
							}}
						/>
					</Box>
				</Box>
			)}
			{!isThinking && !currentResponse && !approvalInterruption && (
				<Box flexDirection="row">
					<Text bold color="green">{'> '}</Text>
					<TextInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
					/>
				</Box>
			)}
			{isThinking && (
				<Box position="absolute" right={0} bottom={0}>
					<Text color="yellow">
						{!trackedState.disableSpinner && <Spinner />}
						<Text italic>thinking...</Text>
					</Text>
				</Box>
			)}
		</Box>
	);
};
