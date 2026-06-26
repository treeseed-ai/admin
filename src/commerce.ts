import type { CatalogItemOfferMode } from '@treeseed/sdk/types';

export interface AdminOffer {
  id: string;
  itemId: string;
  mode: CatalogItemOfferMode;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminEntitlement {
  allowed: boolean;
  reason?: string;
  checkoutUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AdminCommerceProvider {
  id: string;
  listOffers?(context: unknown): Promise<AdminOffer[]>;
  resolveEntitlement?(context: unknown, item: unknown): Promise<AdminEntitlement>;
  checkoutUrl?(context: unknown, item: unknown): Promise<string | null>;
}

export const DEFAULT_ADMIN_COMMERCE_PROVIDER: AdminCommerceProvider = {
  id: 'none',
  async resolveEntitlement(_context, item) {
    const offerMode = typeof (item as Record<string, unknown> | null)?.offerMode === 'string'
      ? String((item as Record<string, unknown>).offerMode)
      : typeof (item as Record<string, any> | null)?.offer?.priceModel === 'string'
        ? String((item as Record<string, any>).offer.priceModel)
        : 'free';
    const blockedModes = new Set<string>([
      'one_time',
      'one_time_current_version',
      'subscription',
      'subscription_updates',
      'professional_hosting',
      'scoped_contract',
    ]);
    return {
      allowed: !blockedModes.has(offerMode),
      reason: blockedModes.has(offerMode)
        ? 'This offer requires a commerce provider registered by the hosting tenant.'
        : undefined,
      checkoutUrl: null,
    };
  },
  async checkoutUrl() {
    return null;
  },
};
