import type {
	CapabilityDefinition,
	CollectionFilterField,
	NavigationItem,
	ResourceUiSchema,
} from '@treeseed/ui';

export const QUESTION_ACTION_IDS = {
	read: 'question.read',
	create: 'question.create',
	edit: 'question.edit',
	save: 'question.save',
	export: 'question.export',
} as const;

export const QUESTION_STATUS_OPTIONS = [
	{ label: 'Any status', value: '' },
	{ label: 'Recorded', value: 'recorded' },
	{ label: 'Planned', value: 'planned' },
	{ label: 'Live', value: 'live' },
	{ label: 'In progress', value: 'in progress' },
	{ label: 'Exploratory', value: 'exploratory' },
	{ label: 'Speculative', value: 'speculative' },
] as const;

export const QUESTION_TYPE_OPTIONS = [
	{ label: 'Any type', value: '' },
	{ label: 'Strategy', value: 'strategy' },
	{ label: 'Implementation', value: 'implementation' },
	{ label: 'Research', value: 'research' },
	{ label: 'Evaluation', value: 'evaluation' },
] as const;

export const QUESTION_WORK_NAV_ENTRY: NavigationItem = {
	label: 'Questions',
	href: '/app/work/questions',
};

export const QUESTION_CAPABILITY: CapabilityDefinition = {
	id: 'work.questions',
	label: 'Questions',
	scope: 'project',
	path: '/app/work/questions',
	template: 'collection',
	resourceType: 'question',
	access: ['signed-in principal', 'active team', 'project work policy'],
	actions: Object.values(QUESTION_ACTION_IDS),
	primaryAction: QUESTION_ACTION_IDS.create,
	secondaryActions: [QUESTION_ACTION_IDS.export],
	help: {
		topicIds: ['work-content', 'questions'],
		summary: 'Questions capture the uncertainty that directs project work, proposals, decisions, and knowledge generation.',
		feedbackType: 'question',
	},
	feedbackContext: ['route', 'team', 'project', 'capability', 'resource'],
};

export const QUESTION_RESOURCE_SCHEMA: ResourceUiSchema = {
	type: 'question',
	display: {
		label: 'Question',
		pluralLabel: 'Questions',
		summaryField: 'summary',
		statusField: 'status',
	},
	collection: {
		emptyTitle: 'No question content yet',
		emptyDescription: 'Question records appear from src/content/questions.',
		displayModes: ['cards', 'table'],
	},
	actions: {
		primary: [QUESTION_ACTION_IDS.create, QUESTION_ACTION_IDS.edit, QUESTION_ACTION_IDS.save],
		secondary: [QUESTION_ACTION_IDS.export],
	},
	help: QUESTION_CAPABILITY.help,
};

export function questionCollectionFilters(values: { q?: string; status?: string; questionType?: string }): CollectionFilterField[] {
	return [
		{ key: 'q', label: 'Search', type: 'search', value: values.q ?? '' },
		{ key: 'status', label: 'Status', type: 'select', value: values.status ?? '', options: [...QUESTION_STATUS_OPTIONS] },
		{ key: 'questionType', label: 'Type', type: 'select', value: values.questionType ?? '', options: [...QUESTION_TYPE_OPTIONS] },
	];
}
