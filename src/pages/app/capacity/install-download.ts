import type { APIRoute } from 'astro';
import { capacityInstallConfigurationSchema } from '@treeseed/sdk/capacity-provider';
import { controlPlaneOperation } from '@treeseed/sdk/operator-contracts';
import { ApiClientFacade, resolveApiBaseUrl } from '../../../lib/market/api-client';
import { requireCsrf } from '../../../lib/auth/support/csrf';
import { loadAppContext } from '../../../view-models/app-access';

export const POST: APIRoute = async context => {
  const headers = { 'Cache-Control': 'private, no-store', 'Pragma': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
  try {
    if (!context.locals.auth?.principal) return new Response('Sign in to download installation configuration.', {status:401,headers});
    const form = await context.request.formData(); requireCsrf(context, form.get('csrfToken'));
    const app = await loadAppContext(context), team = app.activeTeam;
    if (!team || form.get('teamId') !== team.id) return new Response('The selected team changed. Reload the installation page.', {status:409,headers});
    const api = new ApiClientFacade(context);
    // Existing API authority checks and audit policy apply; never expose a code in page HTML.
    const receipt: any = await api.invoke(controlPlaneOperation('providers.registration.code.reveal'), {path:{teamId:team.id},query:{},body:{}});
    const configuration = capacityInstallConfigurationSchema.parse({schemaVersion:'treeseed.capacity-install-configuration/v1',
      profile:'capacity-provider',teamId:team.id,registrationGeneration:receipt.generation,generatedAt:new Date().toISOString(),
      inputs:{controlPlaneUrl:resolveApiBaseUrl(context.locals),teamRegistrationCode:receipt.registrationCode}});
    return new Response(JSON.stringify(configuration,null,2)+'\n', {headers:{...headers,'Content-Type':'application/json',
      'Content-Disposition':'attachment; filename="treeseed-capacity.json"'}});
  } catch (error) {
    const status = Number((error as any)?.status);
    return new Response('Configuration could not be generated. Check team permission and try again.', {status:[401,403,409].includes(status)?status:503,headers});
  }
};
