const publicId = 'virtual:treeseed-source-update';
const resolvedId = '\0' + publicId;

/** Timestamp of the source generation served by Vite, not of the HTTP request. */
export function sourceUpdates(enabled: boolean, clock = () => Date.now()) {
  let updatedAt = enabled ? new Date(clock()).toISOString() : null;
  return {
    name: 'treeseed-source-updates',
    resolveId(id: string) { if (id === publicId) return resolvedId; },
    load(id: string) { if (id === resolvedId) return `export default ${JSON.stringify(updatedAt)};`; },
    handleHotUpdate(context: any) {
      if (!enabled) return;
      updatedAt = new Date(clock()).toISOString();
      const module = context.server.moduleGraph.getModuleById(resolvedId);
      if (module) context.server.moduleGraph.invalidateModule(module);
      context.server.ws.send({type: 'custom', event: 'treeseed:source-update', data: {updatedAt}});
    },
  };
}
