export function splitItemsIntelligently<T extends { type?: string | undefined; content?: any }>(
	items: T[],
	targetRecentCount = 3,
): { itemsToCompact: T[]; recentItems: T[] } {
	// Find the split point that doesn't break a tool call/result pair
	let splitIndex = Math.max(0, items.length - targetRecentCount);

	// Ensure we don't split between a function_call and its function_call_result
	// We want both to be in the same group (either compact or recent)
	while (splitIndex > 0 && splitIndex < items.length) {
		const itemAtSplit = items[splitIndex] as any;
		// If the item at split is a result, its call MUST be before it.
		// If we split here, the result goes to recentItems and the call goes to itemsToCompact.
		// This is what we want to avoid.
		if (itemAtSplit.type === 'function_call_result') {
			// Move split-index back before the result's corresponding call
			// For simplicity, we just move it back by one and check again
			splitIndex--;
		} else {
			break;
		}
	}

	return {
		itemsToCompact: items.slice(0, splitIndex),
		recentItems: items.slice(splitIndex),
	};
}
