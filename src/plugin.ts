import { envField } from 'astro/config';
import { definePlugin } from '@treeseed/sdk/platform/plugin';
import type { Plugin } from '@treeseed/sdk/platform/plugin';
import { ADMIN_ROUTES, ADMIN_SUPPORT_ROUTES } from './routes.js';
import { DEFAULT_ADMIN_COMMERCE_PROVIDER } from './commerce.js';

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
  TREESEED_BETTER_AUTH_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_WEB_SERVICE_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_WEB_SERVICE_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_WEB_ASSERTION_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_WEB_CSRF_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
  TREESEED_AUTH_MODE: envField.enum({ values: ['internal-first', 'internal-only', 'providers-only'], context: 'server', access: 'secret', optional: true }),
  TREESEED_AUTH_INTERNAL_SIGNUP: envField.enum({ values: ['open', 'invite', 'admin'], context: 'server', access: 'secret', optional: true }),
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
