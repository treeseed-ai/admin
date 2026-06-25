export interface CapacityRuntimeBlockerVm {
	code: string;
	severity: 'info' | 'warning' | 'danger' | 'error' | string;
	title?: string;
	message?: string;
	owner?: string;
	assignmentId?: string | null;
	projectId?: string | null;
	providerId?: string | null;
	nextAction?: string;
	evidence?: Array<{ label: string; value: string }>;
}

export interface CapacityRuntimeDiagnosticsResponse {
	projectId: string;
	teamId: string;
	generatedAt: string;
	assignments: unknown[];
	explanations: unknown[];
	modeRuns: unknown[];
	treeDxProxyAudit: unknown[];
	ledgerEntries: Array<Record<string, unknown> & { assignmentId?: string | null; modeRunId?: string | null }>;
	fallbackOutputs: unknown[];
	diagnostics: CapacityRuntimeBlockerVm[];
}

export interface CapacityRuntimeDiagnosticVm {
	summary: {
		health: 'ready' | 'degraded' | 'blocked' | 'unknown';
		openSessions: number;
		leasedAssignments: number;
		blockedAssignments: number;
		failedAssignments: number;
		unsettledAssignments: number;
		missingTreeDxAuditCount: number;
	};
	blockers: CapacityRuntimeBlockerVm[];
	assignments: Array<Record<string, unknown>>;
	selectedAssignment?: Record<string, unknown> | null;
	settlement: {
		ledgerEntries: Array<Record<string, unknown>>;
		unsettledAssignments: Array<Record<string, unknown>>;
	};
	treeDx: {
		auditRows: Array<Record<string, unknown>>;
		missingAuditAssignmentIds: string[];
	};
}

function record(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
	return value == null || value === '' ? '' : String(value);
}

export function buildCapacityRuntimeDiagnosticVm(
	response: CapacityRuntimeDiagnosticsResponse,
	selectedAssignmentId?: string | null,
): CapacityRuntimeDiagnosticVm {
	const assignments = response.assignments.map((assignment) => assignment as unknown as Record<string, unknown>);
	const ledgerEntries = response.ledgerEntries.map((entry) => entry as unknown as Record<string, unknown>);
	const terminalPhases = new Set(['task_completed_actual_settlement', 'reservation_released', 'task_failed_refund']);
	const settledAssignmentIds = new Set(ledgerEntries
		.filter((entry) => terminalPhases.has(String(entry.phase ?? '')))
		.map((entry) => text(entry.assignmentId))
		.filter(Boolean));
	const unsettledAssignments = assignments.filter((assignment) => {
		const status = String(assignment.status ?? '');
		return ['completed', 'failed', 'returned'].includes(status)
			&& assignment.reservationId
			&& !settledAssignmentIds.has(text(assignment.id));
	});
	const treeDxProxyAudit = response.treeDxProxyAudit.map((audit) => record(audit));
	const treeDxAuditAssignmentIds = new Set(treeDxProxyAudit
		.map((audit) => text(audit.assignmentId))
		.filter(Boolean));
	const missingAuditAssignmentIds = assignments
		.filter((assignment) => record(assignment.treedxProxyHandle).id && !treeDxAuditAssignmentIds.has(text(assignment.id)))
		.map((assignment) => text(assignment.id))
		.filter(Boolean);
	const openSessions = 0;
	const leasedAssignments = assignments.filter((assignment) => assignment.leaseState === 'leased').length;
	const failedAssignments = assignments.filter((assignment) => assignment.status === 'failed').length;
	const blockedAssignments = response.diagnostics.filter((diagnostic) => ['warning', 'danger'].includes(diagnostic.severity)).length;
	const health = failedAssignments > 0 || response.diagnostics.some((diagnostic) => diagnostic.severity === 'danger')
		? 'blocked'
		: blockedAssignments > 0 || unsettledAssignments.length > 0 || missingAuditAssignmentIds.length > 0
			? 'degraded'
			: assignments.length > 0
				? 'ready'
				: 'unknown';
	return {
		summary: {
			health,
			openSessions,
			leasedAssignments,
			blockedAssignments,
			failedAssignments,
			unsettledAssignments: unsettledAssignments.length,
			missingTreeDxAuditCount: missingAuditAssignmentIds.length,
		},
		blockers: response.diagnostics,
		assignments,
		selectedAssignment: selectedAssignmentId
			? assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? null
			: assignments[0] ?? null,
		settlement: {
			ledgerEntries,
			unsettledAssignments,
		},
		treeDx: {
			auditRows: treeDxProxyAudit,
			missingAuditAssignmentIds,
		},
	};
}
