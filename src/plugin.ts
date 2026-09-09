import { envField } from 'astro/config';
import { definePlugin } from '@treeseed/sdk/site-contracts/plugin';
import type { Plugin } from '@treeseed/sdk/site-contracts/plugin';
import { ADMIN_ROUTES, ADMIN_SUPPORT_ROUTES } from './routes.js';
import { DEFAULT_ADMIN_COMMERCE_PROVIDER } from './commerce.js';

export const ADMIN_ENV_METADATA = {
  TREESEED_SITE_URL: { group: 'identity', sensitivity: 'plain', description: 'Canonical HTTPS application origin.', required: true },
  TREESEED_IDENTITY_ISSUER: { group: 'identity', sensitivity: 'plain', description: 'Explicit API-advertised Identity issuer.', required: true },
  TREESEED_IDENTITY_ACCOUNT_URL: { group: 'identity', sensitivity: 'plain', description: 'Trusted Identity account management endpoint.', required: true },
  TREESEED_IDENTITY_WORKLOAD_CLIENT_ID: { group: 'identity', sensitivity: 'plain', description: 'Registered application workload client, distinct from the browser client.', required: true },
  TREESEED_IDENTITY_WORKLOAD_PRIVATE_KEY: { group: 'identity', sensitivity: 'secret', description: 'Deployment-provisioned asymmetric workload bootstrap key. Never sent to browsers.', required: true },
  TREESEED_MARKET_API_BASE_URL: {
    group: 'api',
    sensitivity: 'plain',
    description: 'Singleton Market API base URL used only for Market operations.',
    required: false,
  },
  TREESEED_API_BASE_URL: {
    group: 'api',
    sensitivity: 'plain',
    description: 'Resolved Admin control-plane API base URL used by the server-side facade.',
    required: false,
  },
  TREESEED_CATALOG_MARKET_API_BASE_URLS: {
    group: 'api',
    sensitivity: 'plain',
    description: 'Optional ordered API base URLs used for catalog/profile reads.',
    required: false,
  },
};

export const ADMIN_ENV_SCHEMA: Record<string, unknown> = {
  ...Object.fromEntries(['TREESEED_SITE_URL', 'TREESEED_IDENTITY_ISSUER', 'TREESEED_IDENTITY_ACCOUNT_URL',
    'TREESEED_IDENTITY_WORKLOAD_CLIENT_ID', 'TREESEED_IDENTITY_WORKLOAD_PRIVATE_KEY']
    .map(name => [name, envField.string({ context: 'server', access: 'secret', optional: true })])),
  TREESEED_MARKET_API_BASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_API_BASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_CATALOG_MARKET_API_BASE_URLS: envField.string({ context: 'server', access: 'secret', optional: true }),
};

export const ADMIN_CAPABILITIES = {
  ecommerce: {
    bundled: false,
    defaultProvider: DEFAULT_ADMIN_COMMERCE_PROVIDER.id,
  },
};

const adminPlugin: Plugin = definePlugin({
  id: '@treeseed/admin',
  siteLayers: [{ root: '.', kinds: ['pages', 'styles', 'components'] }],
  siteHooks: {
    routes: [...ADMIN_ROUTES, ...ADMIN_SUPPORT_ROUTES],
    customCss: [
      '@treeseed/ui/styles/tokens.css',
      '@treeseed/ui/styles/theme.css',
      '@treeseed/ui/styles/ui.css',
      '@treeseed/ui/styles/forms.css',
      '@treeseed/ui/styles/knowledge.css',
      '@treeseed/ui/styles/app-shell.css',
      '@treeseed/ui/styles/app-controls.css',
      '@treeseed/ui/styles/charts.css',
      '@treeseed/ui/styles/account/forms.css',
      '@treeseed/ui/styles/auth.css',
    ],
    envSchema: ADMIN_ENV_SCHEMA,
  },
  adminCapabilities: ADMIN_CAPABILITIES,
  commerceProvider: DEFAULT_ADMIN_COMMERCE_PROVIDER,
});

export default adminPlugin;
