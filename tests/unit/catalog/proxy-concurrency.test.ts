import { describe, expect, it } from 'vitest';
import { promoteConcurrencyHeader } from '../../../src/lib/market/proxy-request.ts';

function encoded(value: unknown) {
	return new TextEncoder().encode(JSON.stringify(value)).buffer as ArrayBuffer;
}

describe('Admin browser BFF concurrency', () => {
	it.each([
		['expectedVersion', 'member-v3'],
		['expectedUpdatedAt', '2026-08-26T20:00:00.000Z'],
		['lifecycleVersion', '7'],
	])('promotes %s into If-Match', (field, version) => {
		const headers = new Headers({ 'content-type': 'application/json' });
		promoteConcurrencyHeader(headers, encoded({ [field]: version, roleKey: 'reviewer' }));
		expect(headers.get('if-match')).toBe(version);
	});

	it('never replaces a caller-supplied If-Match header', () => {
		const headers = new Headers({ 'content-type': 'application/json', 'if-match': 'explicit-v4' });
		promoteConcurrencyHeader(headers, encoded({ expectedVersion: 'body-v2' }));
		expect(headers.get('if-match')).toBe('explicit-v4');
	});

	it('leaves malformed and unversioned bodies fail-closed for the API', () => {
		const headers = new Headers({ 'content-type': 'application/json' });
		promoteConcurrencyHeader(headers, encoded({ roleKey: 'reviewer' }));
		expect(headers.has('if-match')).toBe(false);
	});
});
