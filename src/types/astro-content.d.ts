declare module 'astro:content' {
	export const getCollection: (...args: any[]) => Promise<any[]>;
	export const getEntries: (...args: any[]) => Promise<any[]>;
	export const getEntry: (...args: any[]) => Promise<any>;
	export const render: (...args: any[]) => Promise<any>;
}
