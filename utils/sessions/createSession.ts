import { MemorySession, type Session } from '@openai/agents';
import { trackCompaction } from '../../lifecycle/trackCompaction';
import type { WithRunCompaction } from '../../lifecycle/withRunCompaction';
import { DiskSession } from './DiskSession';
import { MemoryCompactionSession } from './MemoryCompactionSession';

export function createSession(sessionPath: string | null = null): Session & WithRunCompaction {
	const underlyingSession = sessionPath ? new DiskSession(sessionPath) : new MemorySession();
	// Always use our own memory compaction session, regardless of provider
	const session = new MemoryCompactionSession({
		underlyingSession,
	});
	trackCompaction(session);
	return session;
}
