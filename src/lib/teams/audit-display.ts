import { roleDisplay } from './access-display';

interface AuditActor {
	displayName?: string | null;
	email?: string | null;
	username?: string | null;
	image?: string | null;
	type?: string | null;
}

interface AuditChange {
	field?: string;
	label?: string;
	before?: unknown;
	after?: unknown;
}

interface TeamAuditEvent {
	id?: string;
	actor?: AuditActor | null;
	actorType?: string;
	eventType?: string;
	data?: Record<string, unknown> | null;
	createdAt?: string;
}

const eventTitles: Record<string, string> = {
	'team.created': 'Team created',
	'team.updated': 'Team profile updated',
	'team.archived': 'Team archived',
	'team.restored': 'Team restored',
	'team.deleted': 'Team permanently deleted',
	'team.invitation.created': 'Invitation sent',
	'team.invitation.resent': 'Invitation resent',
	'team.invitation.revoked': 'Invitation revoked',
	'team.invitation.accepted': 'Invitation accepted',
	'team.member.role_changed': 'Member role changed',
	'team.member.removed': 'Member removed',
	'team.member.left': 'Member left',
	'team.ownership.transferred': 'Ownership transferred',
};

const fieldLabels: Record<string, string> = {
	name: 'Team address',
	displayName: 'Display name',
	logoUrl: 'Logo',
	profileSummary: 'Profile summary',
	visibility: 'Visibility',
	roleKey: 'Role',
};

function text(value: unknown) {
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function subjectLabel(data: Record<string, unknown>) {
	return text(data.subjectDisplayName) ?? text(data.subjectEmail) ?? 'a team member';
}

function changes(data: Record<string, unknown>) {
	if (!Array.isArray(data.changes)) return [];
	return data.changes
		.filter((change): change is AuditChange => Boolean(change) && typeof change === 'object')
		.map((change) => change.label ?? fieldLabels[String(change.field ?? '')] ?? null)
		.filter((label): label is string => Boolean(label));
}

function descriptionFor(eventType: string, data: Record<string, unknown>, changedFields: string[]) {
	const recipient = text(data.recipientEmail) ?? 'a recipient';
	const subject = subjectLabel(data);
	const role = roleDisplay(text(data.roleKey) ?? 'viewer').label;
	switch (eventType) {
		case 'team.created':
			return text(data.name) ? `Created the @${text(data.name)} team.` : 'Created the team and its first owner membership.';
		case 'team.updated':
			return changedFields.length > 0
				? `Updated ${new Intl.ListFormat('en').format(changedFields.map((field) => field.toLowerCase()))}.`
				: 'Updated team identity settings.';
		case 'team.archived':
			return 'Paused team-scoped changes and removed the team from active selection.';
		case 'team.restored':
			return 'Restored the team to active service.';
		case 'team.deleted':
			return 'Permanently removed the team after reauthentication, exact-name confirmation, and blocker checks passed.';
		case 'team.invitation.created':
			return `Invited ${recipient} to join as ${role}.`;
		case 'team.invitation.resent':
			return `Sent a fresh invitation to ${recipient}.`;
		case 'team.invitation.revoked':
			return `Revoked the pending invitation for ${recipient}.`;
		case 'team.invitation.accepted':
			return `${subject} accepted the invitation and joined the team.`;
		case 'team.member.role_changed': {
			const previousRole = text(data.previousRoleKey);
			return previousRole
				? `Changed ${subject} from ${roleDisplay(previousRole).label} to ${role}.`
				: `Changed ${subject}'s role to ${role}.`;
		}
		case 'team.member.removed':
			return `Removed ${subject} and ended their team access.`;
		case 'team.member.left':
			return `${subject} left the team.`;
		case 'team.ownership.transferred':
			return `Transferred ownership to ${subject}.`;
		default:
			return 'Recorded a security-sensitive team change.';
	}
}

export function teamAuditDisplay(event: TeamAuditEvent) {
	const eventType = text(event.eventType) ?? 'team.activity';
	const data = event.data && typeof event.data === 'object' ? event.data : {};
	const changedFields = changes(data);
	const actorType = text(event.actor?.type) ?? text(event.actorType) ?? 'system';
	const actorLabel = text(event.actor?.displayName)
		?? text(event.actor?.email)
		?? (actorType === 'user' ? 'Former team member' : 'TreeSeed system');
	const actorUsername = text(event.actor?.username);
	const description = descriptionFor(eventType, data, changedFields);
	const reason = text(data.reason);
	return {
		title: eventTitles[eventType] ?? 'Team activity recorded',
		description: reason ? `${description} Reason: ${reason}.` : description,
		actorLabel,
		actorKind: actorType === 'user' ? 'Team member' : 'Automated service',
		actorHref: actorType === 'user' && actorUsername
			? `/u/${encodeURIComponent(actorUsername)}`
			: undefined,
		actorImageSrc: actorType === 'user' ? text(event.actor?.image) : null,
		timestamp: event.createdAt,
		details: changedFields.map((field) => `${field} changed`),
		tone: eventType === 'team.deleted' || eventType === 'team.member.removed'
			? 'danger' as const
			: eventType === 'team.archived' || eventType === 'team.invitation.revoked'
				? 'warning' as const
				: 'default' as const,
	};
}
