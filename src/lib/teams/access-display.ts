export interface AccessDisplay {
	label: string;
	description: string;
}

const roleDisplays: Record<string, AccessDisplay> = {
	team_owner: { label: 'Owner', description: 'Owns team identity, membership, lifecycle, projects, releases, products, and billing.' },
	project_lead: { label: 'Project lead', description: 'Leads projects, workstreams, releases, and non-owner membership.' },
	service_admin: { label: 'Service administrator', description: 'Manages provider connections and protected service credentials.' },
	knowledge_admin: { label: 'Knowledge administrator', description: 'Manages books, reviews, publication, and knowledge packs.' },
	knowledge_author: { label: 'Knowledge author', description: 'Creates and links book knowledge in authorized projects.' },
	knowledge_reviewer: { label: 'Knowledge reviewer', description: 'Reviews knowledge diffs and publication readiness.' },
	contributor: { label: 'Contributor', description: 'Edits project direction and moves workstreams forward.' },
	reviewer: { label: 'Reviewer', description: 'Reviews staged work and approves remote execution.' },
	market_steward: { label: 'Market steward', description: 'Manages products and publishes market listings.' },
	finance: { label: 'Finance', description: 'Manages billing and commercial product settings.' },
	viewer: { label: 'Viewer', description: 'Can view team and governance information without making changes.' },
};

const capabilityDisplays: Record<string, AccessDisplay> = {
	manage_projects: { label: 'Manage projects', description: 'Create and configure projects owned by this team.' },
	edit_direct: { label: 'Edit project direction', description: 'Update project direction and working content.' },
	manage_workstreams: { label: 'Manage workstreams', description: 'Create, organize, and advance project workstreams.' },
	stage_releases: { label: 'Manage staging releases', description: 'Prepare and administer releases in staging.' },
	publish_releases: { label: 'Publish production releases', description: 'Promote reviewed releases to production.' },
	publish_market_listings: { label: 'Publish market listings', description: 'Publish team products to the market.' },
	manage_products: { label: 'Manage products', description: 'Create and maintain commercial product settings.' },
	manage_billing: { label: 'Manage billing', description: 'Review and administer team billing.' },
	approve_remote_execution: { label: 'Approve remote execution', description: 'Approve work that runs on remote capacity.' },
	knowledge_read: { label: 'Read knowledge', description: 'Read accessible books and knowledge pages.' },
	knowledge_author: { label: 'Author knowledge', description: 'Create and update book pages in a project workspace.' },
	knowledge_link: { label: 'Link knowledge', description: 'Connect knowledge to other pages and functional content.' },
	knowledge_review: { label: 'Review knowledge', description: 'Inspect diffs, relationships, and publication readiness.' },
	knowledge_publish: { label: 'Publish knowledge', description: 'Approve publication to the project publication ref.' },
	knowledge_manage_books: { label: 'Manage books', description: 'Create, order, archive, and restore books.' },
	knowledge_build_packs: { label: 'Build knowledge packs', description: 'Build immutable packs from selected books.' },
};

const roleCapabilities: Record<string, string[]> = {
	team_owner: Object.keys(capabilityDisplays),
	project_lead: ['manage_projects', 'edit_direct', 'manage_workstreams', 'knowledge_read', 'knowledge_author', 'knowledge_link', 'knowledge_review', 'knowledge_publish', 'knowledge_manage_books', 'knowledge_build_packs'],
	service_admin: [],
	knowledge_admin: ['knowledge_read', 'knowledge_author', 'knowledge_link', 'knowledge_review', 'knowledge_publish', 'knowledge_manage_books', 'knowledge_build_packs'],
	knowledge_author: ['knowledge_read', 'knowledge_author', 'knowledge_link'],
	knowledge_reviewer: ['knowledge_read', 'knowledge_review'],
	contributor: ['edit_direct', 'manage_workstreams', 'knowledge_read', 'knowledge_author', 'knowledge_link'],
	reviewer: ['knowledge_read', 'knowledge_review'],
	market_steward: ['manage_products', 'publish_market_listings'],
	finance: ['manage_billing', 'manage_products'],
	viewer: ['knowledge_read'],
};

function fallbackLabel(value: string) {
	const words = value.replaceAll(':', ' ').replaceAll('_', ' ').trim();
	return words ? words.replace(/^\p{L}/u, (letter) => letter.toUpperCase()) : 'Unknown access';
}

export function roleDisplay(role: string): AccessDisplay {
	return roleDisplays[role] ?? { label: fallbackLabel(role), description: 'Team role.' };
}

export function capabilityDisplay(capability: string): AccessDisplay {
	return capabilityDisplays[capability] ?? { label: fallbackLabel(capability), description: 'Team responsibility.' };
}

export function capabilitiesForRole(role: string) {
	return roleCapabilities[role] ?? [];
}
