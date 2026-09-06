export interface ServiceSection {
	id: string;
	label: string;
	href: string;
	current: boolean;
}

interface ServiceNavigationOptions {
	current: 'connections' | 'vaults';
}

export function serviceSections(options: ServiceNavigationOptions): ServiceSection[] {
	return [
		{ id: 'connections', label: 'Connections', href: '/app/services', current: options.current === 'connections' },
		...(import.meta.env.DEV ? [{ id: 'vaults', label: 'Vaults', href: '/app/services/vaults', current: options.current === 'vaults' }] : []),
	];
}
