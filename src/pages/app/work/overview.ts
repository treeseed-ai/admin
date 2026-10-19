import type { APIContext } from 'astro';
import { atlasContext, atlasError, atlasJson } from '../../../view-models/agent-lab/atlas-response.ts';
import { loadAgentLabFrame } from '../../../view-models/agent-lab/agent-lab-frame.ts';

export async function GET(context: APIContext) {
  try {
    if (context.url.searchParams.has('at')) {
      throw Object.assign(new Error('Historical overview is unavailable.'), { status: 503 });
    }
    const { api, team } = await atlasContext(context);
    const preferences = await api.accountPreferences();
    const frame = await loadAgentLabFrame(api, team, preferences, {
      date: context.url.searchParams.get('date'),
      workday: context.url.searchParams.get('workday'),
    });
    if (frame.overview.connectivity !== 'live') {
      throw Object.assign(new Error('The complete overview is unavailable.'), { status: 503 });
    }
    return atlasJson(frame.overview);
  } catch (error) {
    return atlasError(error);
  }
}
