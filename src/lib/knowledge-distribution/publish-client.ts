const allowedProjectActions = new Set(['share/export', 'share/package-template', 'share/package-knowledge-pack', 'share/publish']);

export async function submitKnowledgeDistributionAction(form: HTMLFormElement, status: HTMLElement | null): Promise<void> {
	const data = new FormData(form);
	const projectId = String(data.get('projectId') ?? '');
	const action = String(data.get('action') ?? '');
	if (!projectId || !allowedProjectActions.has(action)) {
		if (status) status.textContent = 'Choose a project and distribution action.';
		return;
	}
	if (status) status.textContent = 'Submitting...';
	const response = await fetch(`/v1/projects/${encodeURIComponent(projectId)}/${action}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ source: 'knowledge-distribution' }),
	});
	const payload = await response.json().catch(() => null);
	if (!response.ok || payload?.ok === false) {
		if (status) status.textContent = payload?.error ?? 'Action failed.';
		return;
	}
	if (status) status.textContent = 'Submitted.';
}
