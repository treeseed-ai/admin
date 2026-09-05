export interface ServiceSection {
	id: string;
	label: string;
	href: string;
	current: boolean;
}

interface ServiceNavigationOptions {
	current: 'connections';
}

export function serviceSections(options: ServiceNavigationOptions): ServiceSection[] {
	return [
		{ id: 'connections', label: 'Connections', href: '/app/services', current: options.current === 'connections' },
	];
}
