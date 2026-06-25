import type {
	CollectionViewModel,
	FeedbackContext,
	HelpContext,
	HelpTopic,
	PageViewModel,
	ResolvedAction,
	ResolvedActionState,
	ResourceSummary,
} from '@treeseed/ui';
import {
	QUESTION_ACTION_IDS,
	QUESTION_CAPABILITY,
	QUESTION_RESOURCE_SCHEMA,
	QUESTION_TYPE_OPTIONS,
	questionCollectionFilters,
} from '../../capabilities/questions.js';
import type { GovernanceViewModel } from '../governance.vm.js';
import type { KnowledgeViewModel } from '../knowledge.vm.js';
import type { OperationalContext } from '../shared.js';
import {
	type WorkContentEntry,
	workContentRelationSummary,
} from '../work-content.js';

type QuestionType = typeof QUESTION_TYPE_OPTIONS[number]['value'];

export interface QuestionDetailSource {
	id: string;
	slug: string;
	title: string;
	description: string;
	summary: string;
	status: string;
	questionType: string;
	motivation: string;
	primaryContributor: string;
	date: string;
	body: string;
	draft: boolean;
	relatedObjectives: string[];
	relatedBooks: string[];
	href: string;
}

export interface QuestionsPolicy {
	read: ResolvedActionState;
	create: ResolvedActionState;
	edit: ResolvedActionState;
	save: ResolvedActionState;
	export: ResolvedActionState;
	reason?: string;
	remediation?: string;
}

export interface QuestionsCollectionViewModel extends PageViewModel {
	collection: CollectionViewModel;
	operationalCollection: CollectionViewModel;
	help: HelpContext;
	feedback: FeedbackContext;
	policy: QuestionsPolicy;
}

export interface QuestionDetailViewModel extends PageViewModel {
	question: QuestionDetailSource | null;
	metadata: Array<{ key: string; value: string }>;
	relatedRows: Array<Record<string, unknown>>;
	help: HelpContext;
	feedback: FeedbackContext;
	policy: QuestionsPolicy;
	notFound: boolean;
}

export interface QuestionFormViewModel extends PageViewModel {
	mode: 'create' | 'edit';
	question: QuestionDetailSource | null;
	projectOptions: Array<{ label: string; value: string }>;
	selectedProjectId: string;
	formAction: string;
	statusMessageId: string;
	help: HelpContext;
	feedback: FeedbackContext;
	policy: QuestionsPolicy;
	notFound: boolean;
}

interface CollectionInput {
	governance: GovernanceViewModel;
	knowledge: KnowledgeViewModel | null;
	questionEntries: WorkContentEntry[];
	approvalQuestions: Array<Record<string, unknown>>;
	artifactQuestions: Array<Record<string, unknown>>;
	url: URL;
}

interface DetailInput {
	context: OperationalContext;
	question: QuestionDetailSource | null;
	url: URL;
}

interface FormInput extends DetailInput {
	mode: 'create' | 'edit';
}

export function resolveQuestionsPolicy(context: Pick<OperationalContext, 'principal' | 'activeTeam' | 'projects'>): QuestionsPolicy {
	const principal = context.principal;
	if (!principal) {
		return statePolicy('requiresSignIn', 'Sign in to view project questions.', 'Sign in and select a team to continue.');
	}
	const permissions = new Set((principal.permissions ?? []) as string[]);
	if (permissions.has('questions:deny') || permissions.has('work:deny')) {
		return statePolicy('denied', 'Your current role cannot access project questions.', 'Ask a team owner for project work access.');
	}
	if (!context.activeTeam || context.projects.length === 0) {
		return statePolicy('requiresSetup', 'Project questions need an active team and project.', 'Create or select a team with at least one project.');
	}
	const canManage = ['*', '*:*:*', 'projects:*:team', 'projects:manage:team', 'work:manage:team', 'questions:manage'].some((permission) => permissions.has(permission));
	if (!canManage) {
		return {
			read: 'readOnly',
			create: 'readOnly',
			edit: 'readOnly',
			save: 'readOnly',
			export: 'disabledWithReason',
			reason: 'This role can inspect questions but cannot change them.',
			remediation: 'Ask a team owner for project work management access.',
		};
	}
	return {
		read: 'allowed',
		create: 'allowed',
		edit: 'allowed',
		save: 'allowed',
		export: 'disabledWithReason',
		reason: 'Exports arrive with the direction-resource vertical.',
	};
}

export function buildQuestionsPageViewModel(input: CollectionInput): QuestionsCollectionViewModel {
	const { governance, knowledge, questionEntries, approvalQuestions, artifactQuestions, url } = input;
	const policy = resolveQuestionsPolicy(governance.context);
	const filters = filterValues(url);
	const filteredQuestions = filterQuestions(questionEntries, filters);
	const actions = collectionActions(policy);
	const help = helpContext(url, 'collection', actions, governance.context);
	const feedback = feedbackContext(url, 'Questions', governance.context);
	const collection: CollectionViewModel = {
		title: 'Question records',
		description: 'Source content questions from the active TreeSeed workspace.',
		columns: [
			{ key: 'question', label: 'Question' },
			{ key: 'type', label: 'Type' },
			{ key: 'state', label: 'State' },
			{ key: 'visibility', label: 'Visibility' },
			{ key: 'related', label: 'Related' },
		],
		filters: questionCollectionFilters(filters),
		rows: filteredQuestions.map((entry) => ({
			question: entry.title,
			type: entry.type,
			state: entry.status,
			visibility: 'published',
			related: workContentRelationSummary(entry),
		})),
		resources: filteredQuestions.map(questionResourceSummary),
		emptyTitle: QUESTION_RESOURCE_SCHEMA.collection?.emptyTitle ?? 'No question content yet',
		emptyDescription: filteredQuestions.length === questionEntries.length
			? QUESTION_RESOURCE_SCHEMA.collection?.emptyDescription
			: 'No questions match the current filters.',
	};
	const operationalCollection = operationalSignals(approvalQuestions, artifactQuestions);
	return {
		title: 'Questions',
		description: 'List questions from content, decisions, and artifacts.',
		capability: QUESTION_CAPABILITY,
		schema: QUESTION_RESOURCE_SCHEMA,
		collection,
		operationalCollection,
		help,
		feedback,
		actions,
		navigation: workNavigation(),
		breadcrumbs: [{ label: 'Work', href: '/app/work' }, { label: 'Questions' }],
		permissions: permissions(policy),
		policy,
	};
}

export function buildQuestionDetailViewModel(input: DetailInput): QuestionDetailViewModel {
	const { context, question, url } = input;
	const policy = resolveQuestionsPolicy(context);
	const actions = detailActions(policy, question);
	return {
		title: question?.title ?? 'Question not found',
		description: question?.description ?? 'This question record is not available.',
		capability: { ...QUESTION_CAPABILITY, template: 'detail' },
		schema: QUESTION_RESOURCE_SCHEMA,
		question,
		metadata: question ? questionMetadata(question) : [],
		relatedRows: question ? relatedRows(question) : [],
		help: helpContext(url, 'detail', actions, context, question),
		feedback: feedbackContext(url, question?.title ?? 'Question', context, question),
		actions,
		navigation: workNavigation(),
		breadcrumbs: [
			{ label: 'Work', href: '/app/work' },
			{ label: 'Questions', href: '/app/work/questions' },
			{ label: question?.title ?? 'Missing question' },
		],
		permissions: permissions(policy),
		policy,
		notFound: !question,
	};
}

export function buildQuestionFormViewModel(input: FormInput): QuestionFormViewModel {
	const { context, question, url, mode } = input;
	const policy = resolveQuestionsPolicy(context);
	const actions = formActions(policy, mode);
	const selectedProjectId = stringValue(url.searchParams.get('projectId'), stringValue(context.projects[0]?.id, ''));
	const title = mode === 'create' ? 'New question' : question?.title ?? 'Question not found';
	return {
		title,
		description: mode === 'create' ? 'Create a project question content record.' : 'Edit the canonical question content record.',
		capability: { ...QUESTION_CAPABILITY, template: 'settings' },
		schema: QUESTION_RESOURCE_SCHEMA,
		mode,
		question,
		projectOptions: context.projects.map((project: any) => ({ label: stringValue(project.name ?? project.slug, project.id), value: stringValue(project.id, '') })),
		selectedProjectId,
		formAction: `/v1/projects/${encodeURIComponent(selectedProjectId)}/local-content/questions`,
		statusMessageId: mode === 'create' ? 'question-create-status' : 'question-edit-status',
		help: helpContext(url, 'settings', actions, context, question),
		feedback: feedbackContext(url, title, context, question),
		actions,
		navigation: workNavigation(),
		breadcrumbs: [
			{ label: 'Work', href: '/app/work' },
			{ label: 'Questions', href: '/app/work/questions' },
			{ label: mode === 'create' ? 'New' : 'Edit' },
		],
		permissions: permissions(policy),
		policy,
		notFound: mode === 'edit' && !question,
	};
}

export function normalizeQuestionEntry(entry: any, slugFallback = ''): QuestionDetailSource | null {
	if (!entry) return null;
	const data = entry.data ?? {};
	const slug = stringValue(String(entry.id ?? slugFallback).replace(/\.(mdx|md)$/u, ''), slugFallback);
	return {
		id: stringValue(data.id, `question:${slug}`),
		slug,
		title: stringValue(data.title, titleFromSlug(slug)),
		description: stringValue(data.description, ''),
		summary: stringValue(data.summary, ''),
		status: stringValue(data.status, 'recorded'),
		questionType: stringValue(data.questionType ?? data.question_type, 'strategy'),
		motivation: stringValue(data.motivation, ''),
		primaryContributor: relationId(data.primaryContributor ?? data.primary_contributor),
		date: dateValue(data.date),
		body: stringValue(entry.body, ''),
		draft: Boolean(data.draft),
		relatedObjectives: relationValues(data.relatedObjectives ?? data.related_objectives),
		relatedBooks: relationValues(data.relatedBooks ?? data.related_books),
		href: `/app/work/questions/${encodeURIComponent(slug)}`,
	};
}

function statePolicy(state: ResolvedActionState, reason: string, remediation: string): QuestionsPolicy {
	return { read: state, create: state, edit: state, save: state, export: 'disabledWithReason', reason, remediation };
}

function collectionActions(policy: QuestionsPolicy): ResolvedAction[] {
	return [
		action(QUESTION_ACTION_IDS.create, 'New question', policy.create, '/app/work/questions/new', policy),
		action(QUESTION_ACTION_IDS.export, 'Export', policy.export, undefined, { reason: 'Exports arrive with a later packaging vertical.' }),
	];
}

function detailActions(policy: QuestionsPolicy, question: QuestionDetailSource | null): ResolvedAction[] {
	return [
		action(QUESTION_ACTION_IDS.edit, 'Edit', question ? policy.edit : 'hidden', question ? `${question.href}/edit` : undefined, policy),
		action(QUESTION_ACTION_IDS.export, 'Export', question ? policy.export : 'hidden', undefined, { reason: 'Exports arrive with a later packaging vertical.' }),
	];
}

function formActions(policy: QuestionsPolicy, mode: 'create' | 'edit'): ResolvedAction[] {
	return [
		action(QUESTION_ACTION_IDS.save, mode === 'create' ? 'Create question' : 'Save question', mode === 'create' ? policy.create : policy.save, undefined, policy),
		{ id: 'question.cancel', label: 'Cancel', state: 'allowed', href: '/app/work/questions', method: 'GET', confirmation: 'none', auditSensitivity: 'normal' },
	];
}

function action(id: string, label: string, state: ResolvedActionState, href: string | undefined, policy: Pick<QuestionsPolicy, 'reason' | 'remediation'>): ResolvedAction {
	return {
		id,
		label,
		state,
		href,
		reason: state === 'allowed' || state === 'hidden' ? undefined : policy.reason,
		remediation: state === 'allowed' || state === 'hidden' ? undefined : policy.remediation,
		method: href ? 'GET' : 'POST',
		confirmation: 'none',
		auditSensitivity: 'normal',
	};
}

function permissions(policy: QuestionsPolicy): Record<string, ResolvedActionState> {
	return {
		[QUESTION_ACTION_IDS.read]: policy.read,
		[QUESTION_ACTION_IDS.create]: policy.create,
		[QUESTION_ACTION_IDS.edit]: policy.edit,
		[QUESTION_ACTION_IDS.save]: policy.save,
		[QUESTION_ACTION_IDS.export]: policy.export,
	};
}

function filterValues(url: URL) {
	return {
		q: stringValue(url.searchParams.get('q'), ''),
		status: stringValue(url.searchParams.get('status'), ''),
		questionType: stringValue(url.searchParams.get('questionType'), '') as QuestionType,
	};
}

function filterQuestions(entries: WorkContentEntry[], filters: ReturnType<typeof filterValues>): WorkContentEntry[] {
	const q = filters.q.toLowerCase();
	return entries.filter((entry) => {
		if (q && !`${entry.title} ${entry.summary} ${entry.description} ${entry.status} ${entry.type}`.toLowerCase().includes(q)) return false;
		if (filters.status && entry.status !== filters.status) return false;
		if (filters.questionType && entry.type !== filters.questionType) return false;
		return true;
	});
}

function operationalSignals(approvalQuestions: Array<Record<string, unknown>>, artifactQuestions: Array<Record<string, unknown>>): CollectionViewModel {
	const rows = [
		...approvalQuestions.map((item) => ({
			question: stringValue(item.title, 'Question decision'),
			source: 'Decision',
			state: stringValue(item.state, 'pending'),
			target: `/app/work/decisions/${encodeURIComponent(stringValue(item.approvalId ?? item.id, ''))}`,
		})),
		...artifactQuestions.map((artifact) => ({
			question: stringValue(artifact.title, 'Question artifact'),
			source: 'Artifact',
			state: stringValue(artifact.state, 'generated'),
			target: stringValue(artifact.href, '/app/knowledge/artifacts'),
		})),
	];
	return {
		title: 'Question signals',
		description: 'Question-like records across decisions and generated artifacts.',
		columns: [
			{ key: 'question', label: 'Question' },
			{ key: 'source', label: 'Source' },
			{ key: 'state', label: 'State' },
			{ key: 'target', label: 'Target' },
		],
		rows,
		emptyTitle: 'No questions found',
		emptyDescription: 'Questions appear here when decisions or research artifacts include them.',
	};
}

function helpContext(url: URL, template: 'collection' | 'detail' | 'settings', actions: ResolvedAction[], context: OperationalContext, question?: QuestionDetailSource | null): HelpContext {
	const routePattern = template === 'collection'
		? '/app/work/questions'
		: template === 'detail'
			? '/app/work/questions/[slug]'
			: question
				? '/app/work/questions/[slug]/edit'
				: '/app/work/questions/new';
	const actionTopic = actions.find((actionItem) => actionItem.state !== 'allowed' && actionItem.reason);
	const visibility: HelpTopic['visibility'] = context.activeTeam ? 'team' : 'authenticated';
	const topics: HelpTopic[] = [
		{
			id: 'questions',
			title: 'Project questions',
			summary: QUESTION_CAPABILITY.help?.summary ?? 'Questions capture project uncertainty.',
			href: '/app/work/questions',
			visibility,
			source: 'capability',
		},
		...(actionTopic ? [{
			id: `action:${actionTopic.id}`,
			title: `${actionTopic.label} availability`,
			summary: [actionTopic.reason, actionTopic.remediation].filter(Boolean).join(' '),
			visibility,
			source: 'action-state' as const,
		}] : []),
	];
	return {
		capabilityId: QUESTION_CAPABILITY.id,
		topicIds: ['work-content', 'questions'],
		shell: 'product',
		context: 'project',
		resourceType: 'question',
		resourceId: question?.id,
		routePattern,
		canonicalPath: question?.href ?? '/app/work/questions',
		template,
		summary: QUESTION_CAPABILITY.help?.summary,
		topics,
		relatedDocs: topics.map((topic, index) => ({
			topicId: topic.id,
			title: topic.title,
			href: topic.href ?? `${url.pathname}#${encodeURIComponent(topic.id)}`,
			visibility: topic.visibility,
			summary: topic.summary,
			source: topic.source,
			current: index === 0,
		})),
		relatedActions: actions,
		searchScope: 'project',
		searchPlaceholder: 'Search question help and action guidance',
		visibility: context.activeTeam ? 'team' : 'authenticated',
		feedbackType: 'question',
	};
}

function feedbackContext(url: URL, title: string, context: OperationalContext, question?: QuestionDetailSource | null): FeedbackContext {
	return {
		url: url.toString(),
		canonicalPath: question?.href ?? '/app/work/questions',
		title,
		capabilityId: QUESTION_CAPABILITY.id,
		shell: 'product',
		context: 'project',
		teamId: context.activeTeam?.id,
		projectId: context.projects[0]?.id,
		resourceType: 'question',
		resourceId: question?.id,
		environment: 'local',
		submissionEndpoint: '/v1/feedback',
		allowAnonymous: false,
		screenshotPolicy: 'optional',
		attachmentStoragePolicy: 'private',
		routePattern: question ? '/app/work/questions/[slug]' : '/app/work/questions',
		policy: context.activeTeam ? 'team' : 'authenticated',
	};
}

function workNavigation(): Array<{ label: string; href: string }> {
	return [
		{ label: 'Objectives', href: '/app/work/objectives' },
		{ label: 'Questions', href: '/app/work/questions' },
		{ label: 'Notes', href: '/app/work/notes' },
		{ label: 'Proposals', href: '/app/work/proposals' },
		{ label: 'Decisions', href: '/app/work/decisions' },
	];
}

function questionResourceSummary(entry: WorkContentEntry): ResourceSummary {
	return {
		id: entry.id,
		title: entry.title,
		description: entry.summary || entry.description,
		href: entry.href,
		status: entry.status,
		meta: `${entry.type} · ${workContentRelationSummary(entry)}`,
	};
}

function questionMetadata(question: QuestionDetailSource): Array<{ key: string; value: string }> {
	return [
		{ key: 'Status', value: question.status },
		{ key: 'Visibility', value: question.draft ? 'draft' : 'published' },
		{ key: 'Question type', value: question.questionType },
		{ key: 'Contributor', value: question.primaryContributor || 'not recorded' },
		{ key: 'Date', value: question.date },
		{ key: 'Content id', value: question.id },
		{ key: 'Source slug', value: question.slug },
	].filter((item) => item.value);
}

function relatedRows(question: QuestionDetailSource): Array<Record<string, unknown>> {
	return [
		...question.relatedObjectives.map((value) => ({ kind: 'Objective', reference: value })),
		...question.relatedBooks.map((value) => ({ kind: 'Book', reference: value })),
	];
}

function relationValues(value: unknown): string[] {
	if (Array.isArray(value)) return value.map(relationId).filter(Boolean);
	const single = relationId(value);
	return single ? [single] : [];
}

function relationId(value: unknown): string {
	if (typeof value === 'string') return value.replace(/^[^:]+:/u, '');
	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		return stringValue(record.id ?? record.slug ?? record.collection, '');
	}
	return '';
}

function stringValue(value: unknown, fallback = ''): string {
	return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function dateValue(value: unknown): string {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 10);
	return '';
}

function titleFromSlug(slug: string): string {
	return slug.replace(/[-_]+/gu, ' ').replace(/\b\w/gu, (match) => match.toUpperCase());
}
