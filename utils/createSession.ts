import { MemorySession, OpenAIResponsesCompactionSession, type Session } from '@openai/agents';
import { getModel, isOpenAIModel } from '../lifecycle/getModel';
import { trackCompaction } from '../lifecycle/trackCompaction';
import { MemoryCompactionSession } from './MemoryCompactionSession';

export function createSession(compactionModel: string | null): Session {
	if (isOpenAIModel(compactionModel || 'gpt-4o-mini')) {
		const session = new OpenAIResponsesCompactionSession({
			underlyingSession: new MemorySession(),
			model: getModel(compactionModel, 'gpt-4o-mini') as any,
		}) as OpenAIResponsesCompactionSession & {
			runCompaction: typeof OpenAIResponsesCompactionSession.prototype.runCompaction;
		};
		trackCompaction(session);
		return session;
	}

	const session = new MemoryCompactionSession({
		underlyingSession: new MemorySession(),
		model: getModel(compactionModel, 'gpt-4o-mini') as any,
	}) as MemoryCompactionSession & {
		runCompaction: typeof MemoryCompactionSession.prototype.runCompaction;
	};
	trackCompaction(session);
	return session;
}
