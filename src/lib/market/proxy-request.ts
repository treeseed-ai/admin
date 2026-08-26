const concurrencyFields = ['expectedVersion', 'expectedUpdatedAt', 'lifecycleVersion'] as const;

export function promoteConcurrencyHeader(headers: Headers, body: ArrayBuffer | undefined) {
	if (!body || headers.has('if-match')) return;
	if (!(headers.get('content-type') ?? '').toLowerCase().includes('application/json')) return;
	try {
		const value = JSON.parse(new TextDecoder().decode(body));
		if (!value || typeof value !== 'object' || Array.isArray(value)) return;
		for (const field of concurrencyFields) {
			const candidate = value[field];
			if (typeof candidate === 'string' && candidate.trim()) {
				headers.set('if-match', candidate.trim());
				return;
			}
		}
	} catch {
		// The API remains authoritative for malformed JSON errors.
	}
}
