import { envField } from 'astro/config';
import { defineTreeseedPlugin } from '@treeseed/sdk/platform/plugin';
import type { TreeseedPlugin } from '@treeseed/sdk/platform/plugin';
import { ADMIN_ROUTES } from './routes.js';
import { DEFAULT_ADMIN_COMMERCE_PROVIDER } from './commerce.js';
import { DEFAULT_SECRET_MANAGER_PROVIDERS } from './secret-managers.js';

export const ADMIN_ENV_METADATA = {
  TREESEED_BETTER_AUTH_SECRET: {
    group: 'auth',
    sensitivity: 'secret',
    description: 'Stable signing secret for the admin browser authentication boundary.',
    required: true,
  },
  TREESEED_WEB_SERVICE_ID: {
    group: 'auth',
    sensitivity: 'plain',
    description: 'Stable service identity used by the admin web tier when it calls the Treeseed API.',
    required: true,
  },
  TREESEED_WEB_SERVICE_SECRET: {
    group: 'auth',
    sensitivity: 'secret',
    description: 'Shared secret used by the admin web tier to authenticate to the Treeseed API.',
    required: true,
  },
  TREESEED_WEB_ASSERTION_SECRET: {
    group: 'auth',
    sensitivity: 'secret',
    description: 'Secret used to sign short-lived admin user assertions for the Treeseed API.',
    required: true,
  },
  TREESEED_WEB_CSRF_SECRET: {
    group: 'auth',
    sensitivity: 'secret',
    description: 'Secret used by admin browser actions for CSRF protection.',
    required: true,
  },
  TREESEED_AUTH_MODE: {
    group: 'auth',
    sensitivity: 'plain',
    description: 'Controls whether internal, OAuth provider, or mixed sign-in methods are available.',
    values: ['internal-first', 'internal-only', 'providers-only'],
    required: false,
  },
  TREESEED_AUTH_INTERNAL_SIGNUP: {
    group: 'auth',
    sensitivity: 'plain',
    description: 'Controls whether internal email/password account creation is open, invite-only, or admin-only.',
    values: ['open', 'invite', 'admin'],
    required: false,
  },
  TREESEED_MARKET_API_BASE_URL: {
    group: 'api',
    sensitivity: 'plain',
    description: 'Primary Treeseed API base URL used by the admin web facade.',
    required: false,
  },
  TREESEED_CENTRAL_MARKET_API_BASE_URL: {
    group: 'api',
    sensitivity: 'plain',
    description: 'Fallback central Treeseed API base URL used by distributable admin deployments.',
    required: false,
  },
  TREESEED_CATALOG_MARKET_API_BASE_URLS: {
    group: 'api',
    sensitivity: 'plain',
    description: 'Optional ordered API base URLs used for catalog/profile reads.',
    required: false,
  },
  TREESEED_ADMIN_SECRET_MANAGER_PROVIDER: {
    group: 'secret-managers',
    sensitivity: 'plain',
    description: 'Selected linked secret manager provider for admin credential and secret workflows.',
    values: DEFAULT_SECRET_MANAGER_PROVIDERS.map((provider) => provider.id),
    required: false,
  },
};

export const ADMIN_ENV_SCHEMA: Record<string, unknown> = {
  TREESEED_BETTER_AUTH_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_WEB_SERVICE_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_WEB_SERVICE_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_WEB_ASSERTION_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_WEB_CSRF_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_AUTH_MODE: envField.enum({ values: ['internal-first', 'internal-only', 'providers-only'], context: 'server', access: 'secret', optional: true }),
  TREESEED_AUTH_INTERNAL_SIGNUP: envField.enum({ values: ['open', 'invite', 'admin'], context: 'server', access: 'secret', optional: true }),
  TREESEED_MARKET_API_BASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_CENTRAL_MARKET_API_BASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_CATALOG_MARKET_API_BASE_URLS: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_ADMIN_SECRET_MANAGER_PROVIDER: envField.enum({
    values: DEFAULT_SECRET_MANAGER_PROVIDERS.map((provider) => provider.id) as [string, ...string[]],
    context: 'server',
    access: 'secret',
    optional: true,
  }),
};

export const ADMIN_CAPABILITIES = {
  ecommerce: {
    bundled: false,
    defaultProvider: DEFAULT_ADMIN_COMMERCE_PROVIDER.id,
  },
  secretManagers: DEFAULT_SECRET_MANAGER_PROVIDERS.map((provider) => ({
    id: provider.id,
    label: provider.label,
    capabilities: provider.capabilities,
  })),
};

const adminPlugin: TreeseedPlugin = defineTreeseedPlugin({
  id: '@treeseed/admin',
  siteLayers: [{ root: '.', kinds: ['pages', 'styles', 'components'] }],
  siteHooks: {
    routes: ADMIN_ROUTES,
    customCss: [
      '@treeseed/ui/styles/tokens.css',
      '@treeseed/ui/styles/theme.css',
      '@treeseed/ui/styles/ui.css',
      '@treeseed/ui/styles/forms.css',
      '@treeseed/ui/styles/app-shell.css',
      '@treeseed/ui/styles/app-controls.css',
      '@treeseed/ui/styles/auth.css',
    ],
    envSchema: ADMIN_ENV_SCHEMA,
  },
  adminCapabilities: ADMIN_CAPABILITIES,
  commerceProvider: DEFAULT_ADMIN_COMMERCE_PROVIDER,
  secretManagers: DEFAULT_SECRET_MANAGER_PROVIDERS,
});

export default adminPlugin;
