export interface AccessDisplay {
	label: string;
	description: string;
}

const roleDisplays: Record<string, AccessDisplay> = {
	team_owner: { label: 'Owner', description: 'Owns team identity, membership, lifecycle, projects, releases, products, and billing.' },
	project_lead: { label: 'Project lead', description: 'Leads projects, workstreams, releases, and non-owner membership.' },
	contributor: { label: 'Contributor', description: 'Edits project direction and moves workstreams forward.' },
	reviewer: { label: 'Reviewer', description: 'Reviews staged work and approves remote execution.' },
	market_steward: { label: 'Market steward', description: 'Manages products and publishes market listings.' },
	finance: { label: 'Finance', description: 'Manages billing and commercial product settings.' },
	viewer: { label: 'Viewer', description: 'Can view team and governance information without making changes.' },
};

const capabilityDisplays: Record<string, AccessDisplay> = {
	launch_projects: { label: 'Create projects', description: 'Create and configure projects owned by this team.' },
	edit_direct: { label: 'Edit project direction', description: 'Update project direction and working content.' },
	manage_workstreams: { label: 'Manage workstreams', description: 'Create, organize, and advance project workstreams.' },
	stage_releases: { label: 'Manage staging releases', description: 'Prepare and administer releases in staging.' },
	publish_releases: { label: 'Publish production releases', description: 'Promote reviewed releases to production.' },
	publish_market_listings: { label: 'Publish market listings', description: 'Publish team products to the market.' },
	manage_products: { label: 'Manage products', description: 'Create and maintain commercial product settings.' },
	manage_billing: { label: 'Manage billing', description: 'Review and administer team billing.' },
	approve_remote_execution: { label: 'Approve remote execution', description: 'Approve work that runs on remote capacity.' },
};

const roleCapabilities: Record<string, string[]> = {
	team_owner: Object.keys(capabilityDisplays),
	project_lead: ['launch_projects', 'edit_direct', 'manage_workstreams', 'stage_releases', 'publish_releases', 'approve_remote_execution'],
	contributor: ['edit_direct', 'manage_workstreams'],
	reviewer: ['stage_releases', 'approve_remote_execution'],
	market_steward: ['manage_products', 'publish_market_listings'],
	finance: ['manage_billing', 'manage_products'],
	viewer: [],
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
