export type Plugin = Record<string, any>;
export type SiteRouteContribution = {
  pattern: string;
  resourcePath: string;
  capability?: RouteCapability;
};
export type RouteCapability = {
  id: string;
  owner: 'market' | 'admin' | 'core';
  responseKind: string;
  archetype: string;
  shell: string;
  template: string;
  surface: 'auth' | 'public' | 'personal' | 'team' | 'content' | 'system';
  resourceType: string;
  accessPolicy: string[];
  viewModelDependencies: string[];
  navigation: string;
  states: string[];
  selector: string;
  status: string;
  guarantees: string[];
  description: string;
};

export function definePlugin<T extends Plugin>(plugin: T): T {
  return plugin;
}

export function defineRoute<T extends SiteRouteContribution>(route: T): T {
  return route;
}

export function validateRouteCapabilities<T extends readonly SiteRouteContribution[]>(routes: T): T {
  return routes;
}
