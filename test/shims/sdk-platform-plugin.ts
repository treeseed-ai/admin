export type TreeseedPlugin = Record<string, any>;
export type TreeseedSiteRouteContribution = {
  pattern: string;
  resourcePath: string;
};

export function defineTreeseedPlugin<T extends TreeseedPlugin>(plugin: T): T {
  return plugin;
}
