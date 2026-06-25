import { submitPlatformOperationForm } from '@treeseed/ui/lib/app/platform-operation-status';

function pageData(id: string): Record<string, any> {
	const element = document.getElementById(id);
	return element?.textContent ? JSON.parse(element.textContent) : {};
}

async function jsonRequest(url: string, init: RequestInit, status: HTMLElement | null, success: string) {
	const response = await fetch(url, init);
	const payload = await response.json().catch(() => null);
	if (!response.ok || payload?.ok === false) throw new Error(payload?.error ?? 'Request could not be completed.');
	if (status) status.textContent = success;
	return payload;
}

export function bindDirectionContentForm(options: { dataId: string; formId: string; statusId: string; fallbackHref: string }) {
	const data = pageData(options.dataId);
	const form = document.getElementById(options.formId) as HTMLFormElement | null;
	const status = document.getElementById(options.statusId);
	form?.addEventListener('submit', async (event) => {
		event.preventDefault();
		const body = Object.fromEntries(new FormData(form).entries());
		const projectId = String(body.projectId ?? data.projectId ?? '');
		try {
			await submitPlatformOperationForm({
				url: `/v1/projects/${encodeURIComponent(projectId)}/local-content/${encodeURIComponent(String(data.collection ?? 'notes'))}`,
				body,
				statusElement: status,
				fallbackHref: options.fallbackHref,
				initialMessage: 'Queuing content operation...',
			});
		} catch (error) {
			if (status) status.textContent = error instanceof Error ? error.message : 'Content could not be saved.';
		}
	});
}

export function bindDirectionContentForms() {
	document.querySelectorAll<HTMLFormElement>('[data-direction-content-form]').forEach((form) => {
		bindDirectionContentForm({
			dataId: String(form.dataset.directionDataId ?? ''),
			formId: form.id,
			statusId: String(form.dataset.directionStatusId ?? ''),
			fallbackHref: String(form.dataset.directionFallbackHref ?? window.location.pathname),
		});
	});
}

export function bindAllocationForm(options: { dataId: string }) {
	const data = pageData(options.dataId);
	document.querySelectorAll<HTMLFormElement>('[data-allocation-form]').forEach((form) => {
		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const status = form.querySelector<HTMLElement>('[data-allocation-status]');
			if (data.canManage !== true) return;
			if (status) status.textContent = 'Saving allocation...';
			const formData = new FormData(form);
			const body: any = { allocations: JSON.parse(String(formData.get('allocations') ?? '[]')) };
			const mode = form.dataset.allocationForm;
			const url = mode === 'portfolio'
				? `/v1/teams/${encodeURIComponent(String(data.teamId ?? ''))}/capacity-allocation`
				: `/v1/projects/${encodeURIComponent(String(data.projectId ?? form.dataset.projectId ?? ''))}/capacity-allocation`;
			if (mode === 'portfolio') {
				body.capacityProviderId = String(formData.get('capacityProviderId') ?? data.defaultProviderId ?? '');
				body.environment = 'local';
			}
			try {
				await jsonRequest(url, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, status, 'Allocation saved.');
			} catch (error) {
				if (status) status.textContent = error instanceof Error ? error.message : 'Allocation could not be saved.';
			}
		});
	});
}

export function bindWorkdayRequest(options: { dataId: string; buttonId: string; statusId: string }) {
	const data = pageData(options.dataId);
	const button = document.getElementById(options.buttonId);
	const status = document.getElementById(options.statusId);
	button?.addEventListener('click', async () => {
		if (status) status.textContent = 'Requesting workday...';
		try {
			await jsonRequest(`/v1/projects/${encodeURIComponent(String(data.projectId ?? ''))}/workday-requests`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ environment: 'local', type: data.requestType ?? 'one_off_run', reason: data.reason ?? 'Requested from Work UI', payload: { source: data.source ?? 'phase9_work_ui' } }),
			}, status, 'Workday request recorded.');
			window.location.href = `${window.location.pathname}?requested=${Date.now()}`;
		} catch (error) {
			if (status) status.textContent = error instanceof Error ? error.message : 'Workday could not be requested.';
		}
	});
}

export function bindWorkdayRunForm(options: { dataId: string; formSelector?: string; statusSelector?: string }) {
	const data = pageData(options.dataId);
	document.querySelectorAll<HTMLFormElement>(options.formSelector ?? '[data-workday-run-form]').forEach((form) => {
		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const status = form.querySelector<HTMLElement>(options.statusSelector ?? '[data-workday-run-status]');
			const formData = new FormData(form);
			if (status) status.textContent = 'Creating workday run...';
			try {
				const payload = await jsonRequest(`/v1/teams/${encodeURIComponent(String(data.teamId ?? form.dataset.teamId ?? ''))}/workday-runs`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						capacityProviderId: String(formData.get('providerId') || 'local'),
						scenarioId: 'portfolio planning',
						status: 'queued',
						environment: 'local',
						parameters: Object.fromEntries(formData.entries()),
					}),
				}, status, 'Workday run created.');
				const runId = payload?.payload?.id;
				if (runId) window.location.href = `/app/capacity/workday-runs/${encodeURIComponent(runId)}`;
			} catch (error) {
				if (status) status.textContent = error instanceof Error ? error.message : 'Workday run could not be created.';
			}
		});
	});
}

export function bindAgentActions(options: { dataId: string }) {
	const data = pageData(options.dataId);
	const status = document.getElementById('agent-action-status');
	async function post(action: string) {
		if (status) status.textContent = `${action} requested...`;
		try {
			await jsonRequest(`/v1/projects/${encodeURIComponent(String(data.projectId ?? ''))}/agents/${encodeURIComponent(String(data.agentSlug ?? ''))}/${action}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ environment: 'local', reason: `${action} requested from agent page`, payload: { source: 'phase9_agent_page' } }),
			}, status, `${action} request recorded.`);
		} catch (error) {
			if (status) status.textContent = error instanceof Error ? error.message : `${action} could not be requested.`;
		}
	}
	document.getElementById('run-agent-button')?.addEventListener('click', () => void post('run'));
	document.getElementById('pause-agent-button')?.addEventListener('click', () => void post('pause'));
	document.getElementById('resume-agent-button')?.addEventListener('click', () => void post('resume'));
}

export function bindAgentContentForm(options: { dataId: string; formId: string; statusId: string; fallbackHref: string }) {
	const data = pageData(options.dataId);
	const form = document.getElementById(options.formId) as HTMLFormElement | null;
	const status = document.getElementById(options.statusId);
	form?.addEventListener('submit', async (event) => {
		event.preventDefault();
		const body: Record<string, any> = Object.fromEntries(new FormData(form).entries());
		if (data.agentSlug && !body.slug) body.slug = data.agentSlug;
		if (data.mode === 'edit') body.overwrite = true;
		try {
			await submitPlatformOperationForm({
				url: `/v1/projects/${encodeURIComponent(String(data.projectId ?? ''))}/local-content/agents`,
				body,
				statusElement: status,
				fallbackHref: options.fallbackHref,
				initialMessage: 'Queuing agent operation...',
			});
		} catch (error) {
			if (status) status.textContent = error instanceof Error ? error.message : 'Agent could not be saved.';
		}
	});
}
