export interface ServiceSection {
	id: string;
	label: string;
	href: string;
	current: boolean;
}

interface ServiceNavigationOptions {
	current: 'connections' | 'vault';
}

export function serviceSections(options: ServiceNavigationOptions): ServiceSection[] {
	return [
		{ id: 'connections', label: 'Connections', href: '/app/services', current: options.current === 'connections' },
		{ id: 'vault', label: 'Vault', href: '/app/services/vault', current: options.current === 'vault' },
	];
}
