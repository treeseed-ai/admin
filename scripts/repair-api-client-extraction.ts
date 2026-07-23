import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve('src/lib/market/api-client');
const methodFiles = readdirSync(directory)
	.filter((file) => file.endsWith('.ts') && !['interface.ts', 'methods.ts'].includes(file))
	.sort();
const methods: Array<{ file: string; name: string }> = [];

for (const file of methodFiles) {
	const path = resolve(directory, file);
	let source = readFileSync(path, 'utf8');
	source = source.replace(/import \{ ([^}]+) \} from "\.\.\/api-client\.ts";/u, (_statement, names: string) => {
		const imported = names.split(',').map((name) => name.trim());
		const types = imported.filter((name) => ['AstroLike', 'ApiClientFacade'].includes(name));
		const values = imported.filter((name) => !types.includes(name));
		return [
			types.length > 0 ? `import type { ${types.join(', ')} } from '../api-client.ts';` : '',
			values.length > 0 ? `import { ${values.join(', ')} } from '../api-client.ts';` : '',
		].filter(Boolean).join('\n');
	});
	writeFileSync(path, source);
	const match = /export (?:async )?function (\w+Method)\b/u.exec(source);
	if (match) methods.push({ file, name: match[1]! });
}

const properties = methods.map(({ file, name }) =>
	`\t\t${name.replace(/Method$/u, '')}: typeof import('./${file}').${name};`).join('\n');
writeFileSync(resolve(directory, 'interface.ts'), `declare module '../api-client.ts' {
\tinterface ApiClientFacade {
${properties}
\t}
}

export {};
`);
