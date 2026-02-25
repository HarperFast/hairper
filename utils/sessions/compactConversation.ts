import { Agent, type AgentInputItem, run, system } from '@openai/agents';
import { emitToListeners } from '../../ink/emitters/listener';
import { getModel, isOpenAIModel } from '../../lifecycle/getModel';
import { trackedState } from '../../lifecycle/trackedState';
import { excludeFalsy } from '../arrays/excludeFalsy';
import { getModelSettings } from './modelSettings';

export interface CompactionArtifacts {
	noticeContent: string;
	itemsToAdd: AgentInputItem[]; // [firstItem, system(notice), ...recentItems]
}

/**
 * Performs the core compaction transformation given the full items list.
 * Keeps the first item, inserts a system compaction notice (with an optional
 * model-generated summary), and retains the last 3 items.
 */
export async function compactConversation(
	items: AgentInputItem[],
): Promise<CompactionArtifacts> {
	// Find the split point that doesn't break a tool call/result pair
	let splitIndex = Math.max(0, items.length - 3);

	// Ensure we don't split between a function_call and its function_call_result
	// We want both to be in the same group (either compact or recent)
	while (splitIndex > 0 && splitIndex < items.length) {
		const itemAtSplit = items[splitIndex] as any;
		// If the item at split is a result, its call MUST be before it.
		// If we split here, the result goes to recentItems and the call goes to itemsToCompact.
		// This is what we want to avoid.
		if (itemAtSplit.type === 'function_call_result') {
			// Move split index back before the result's corresponding call
			// For simplicity, we just move it back by one and check again
			splitIndex--;
		} else {
			break;
		}
	}

	const recentItems = items.slice(splitIndex);
	const itemsToCompact = items.slice(0, splitIndex);

	let noticeContent = '... conversation history compacted ...';

	if (trackedState.compactionModel && itemsToCompact.length > 0) {
		try {
			const agent = new Agent({
				name: 'History Compactor',
				model: isOpenAIModel(trackedState.compactionModel)
					? trackedState.compactionModel
					: getModel(trackedState.compactionModel),
				modelSettings: getModelSettings(trackedState.compactionModel),
				instructions: 'Compact the provided conversation history.'
					+ '\n- Focus on what is NOT completed and needs to be remembered for later.'
					+ '\n- Do NOT include file content or patches, it is available on the filesystem already. '
					+ '\n- Be concise.',
			});
			emitToListeners('SetCompacting', true);
			const result = await run(
				agent,
				itemsToCompact,
			);

			const summary = result.finalOutput;
			if (summary && summary.trim().length > 0) {
				noticeContent = `Key observations from earlier:\n${summary.trim()}`;
			}
		} catch (err: any) {
			// Keep default notice if summarization fails. Suppress noisy tracing errors
			// like "No existing trace found" which can occur when compaction runs
			// outside an active tracing span. Log other errors at warn level.
			const msg = String(err?.message || err || '');
			const isNoTrace = /no existing trace found/i.test(msg) || /setCurrentSpan/i.test(msg);
			if (!isNoTrace) {
				// eslint-disable-next-line no-console
				console.warn('Compaction summarization failed:', msg);
			}
		} finally {
			emitToListeners('SetCompacting', false);
		}
	}

	const itemsToAdd: AgentInputItem[] = [system(noticeContent), ...recentItems].filter(excludeFalsy);
	return { noticeContent, itemsToAdd };
}
