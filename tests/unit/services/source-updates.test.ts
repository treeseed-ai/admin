import {expect, it, vi} from 'vitest';
import {sourceUpdates} from '../../../scripts/development/source-updates';

it('keeps the timestamp stable across reads and advances it on a source update', () => {
  let now = 1000;
  const plugin = sourceUpdates(true, () => now);
  const id = plugin.resolveId('virtual:treeseed-source-update')!;
  expect(plugin.load(id)).toContain('1970-01-01T00:00:01.000Z');
  now = 2000;
  expect(plugin.load(id)).toContain('00:00:01.000Z');
  const send = vi.fn(); const invalidateModule = vi.fn();
  plugin.handleHotUpdate({server: {moduleGraph: {getModuleById: () => ({}), invalidateModule}, ws: {send}}});
  expect(plugin.load(id)).toContain('00:00:02.000Z');
  expect(send).toHaveBeenCalledWith({type: 'custom', event: 'treeseed:source-update', data: {updatedAt: '1970-01-01T00:00:02.000Z'}});
  expect(invalidateModule).toHaveBeenCalledTimes(1);
});
it('does not expose a live timestamp in released builds', () => {
  const plugin = sourceUpdates(false);
  expect(plugin.load(plugin.resolveId('virtual:treeseed-source-update')!)).toBe('export default null;');
  const send = vi.fn(); plugin.handleHotUpdate({server: {ws: {send}}});
  expect(send).not.toHaveBeenCalled();
});
