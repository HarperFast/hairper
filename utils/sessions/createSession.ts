import { MemorySession, OpenAIResponsesCompactionSession, type Session } from '@openai/agents';
import { getModel, isOpenAIModel } from '../../lifecycle/getModel';
import { trackCompaction } from '../../lifecycle/trackCompaction';
import { DiskSession } from './DiskSession';
import { MemoryCompactionSession } from './MemoryCompactionSession';

export function createSession(compactionModel: string, sessionPath: string | null = null): Session {
	const underlyingSession = sessionPath ? new DiskSession(sessionPath) : new MemorySession();
	const session = isOpenAIModel(compactionModel)
		? new OpenAIResponsesCompactionSession({ underlyingSession, model: compactionModel })
		: new MemoryCompactionSession({ underlyingSession, model: getModel(compactionModel) });
	trackCompaction(session);
	return session;
}
