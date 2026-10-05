import type { APIContext } from 'astro';
import { createApiFacade } from './api-client.js';

type AstroLike = Pick<APIContext, 'locals' | 'cookies' | 'url' | 'request'>;

export async function resolvePublicTeamProfile(context: AstroLike, name: string) {
	return createApiFacade(context).loadTeamProfileByName(name).catch(() => null);
}

export async function resolvePublicUserProfile(context: AstroLike, username: string) {
	return createApiFacade(context).loadUserProfileByUsername(username).catch(() => null);
}
