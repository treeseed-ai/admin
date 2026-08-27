const concurrencyFields = ['expectedVersion', 'expectedUpdatedAt', 'lifecycleVersion'] as const;

export function promoteConcurrencyHeader(headers: Headers, body: ArrayBuffer | undefined) {
	if (!body) return;
	if (!(headers.get('content-type') ?? '').toLowerCase().includes('application/json')) return;
	try {
		const value = JSON.parse(new TextDecoder().decode(body));
		if (!value || typeof value !== 'object' || Array.isArray(value)) return;
		if (!headers.has('if-match')) {
			for (const field of concurrencyFields) {
				const candidate = value[field];
				if (typeof candidate === 'string' && candidate.trim()) {
					headers.set('if-match', candidate.trim());
					break;
				}
			}
		}
		if (!headers.has('idempotency-key') && typeof value.idempotencyKey === 'string' && value.idempotencyKey.trim()) {
			headers.set('idempotency-key', value.idempotencyKey.trim());
		}
	} catch {
		// The API remains authoritative for malformed JSON errors.
	}
}

export async function signedConfirmationHeader(response: Response) {
	if (response.status !== 409) return null;
	const envelope = await response.clone().json().catch(() => null);
	const confirmation = envelope?.inputRequired?.confirmation;
	if (!confirmation || typeof confirmation !== 'object') return null;
	return Buffer.from(JSON.stringify(confirmation)).toString('base64url');
}
