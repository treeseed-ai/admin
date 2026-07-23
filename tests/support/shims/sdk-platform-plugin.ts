export type TreeseedPlugin = Record<string, any>;
export type TreeseedSiteRouteContribution = {
  pattern: string;
  resourcePath: string;
  capability?: TreeseedRouteCapability;
};
export type TreeseedRouteCapability = {
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

export function defineTreeseedPlugin<T extends TreeseedPlugin>(plugin: T): T {
  return plugin;
}

export function defineTreeseedRoute<T extends TreeseedSiteRouteContribution>(route: T): T {
  return route;
}

export function validateTreeseedRouteCapabilities<T extends readonly TreeseedSiteRouteContribution[]>(routes: T): T {
  return routes;
}
