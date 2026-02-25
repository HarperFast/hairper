export function removeHarperInternalProviderData<T extends Record<string, any>>(it: T): T {
	if (!it || typeof it !== 'object') { return it; }
	const out: any = { ...it };
	// Remove any stray top-level 'harper' key just in case
	if ('harper' in out) {
		try {
			delete out.harper;
		} catch {}
	}
	const pd = out.providerData && typeof out.providerData === 'object' ? { ...out.providerData } : undefined;
	if (pd) {
		if ('harper' in pd) {
			try {
				delete (pd as any).harper;
			} catch {}
		}
		// If providerData ends up empty, drop it to avoid sending empty objects upstream
		if (Object.keys(pd).length === 0) {
			try {
				delete out.providerData;
			} catch {
				out.providerData = undefined;
			}
		} else {
			out.providerData = pd;
		}
	}
	return out as T;
}
