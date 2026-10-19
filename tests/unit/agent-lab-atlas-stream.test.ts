import {afterEach,describe,expect,it,vi} from 'vitest';
import type {APIContext} from 'astro';
import {GET} from '../../src/pages/app/work/atlas/stream.ts';

const {snapshot}=vi.hoisted(()=>({snapshot:vi.fn()}));
vi.mock('../../src/view-models/agent-lab/atlas-response.ts',()=>({atlasProjection:snapshot,atlasError:()=>Response.json({ok:false},{status:503})}));
afterEach(()=>{vi.useRealTimers();snapshot.mockReset();});
function context(controller=new AbortController()){
 return {request:new Request('https://admin.test/app/work/atlas/stream?revision=one',{signal:controller.signal}),url:new URL('https://admin.test/app/work/atlas/stream?revision=one')} as APIContext;
}
describe('bounded Atlas snapshot observation',()=>{
 it('signals a failed later snapshot then closes normally for a fresh scoped reconnect without crashing the page',async()=>{
  vi.useFakeTimers();snapshot.mockResolvedValueOnce({revision:'one'}).mockRejectedValueOnce(new Error('private upstream diagnostic'));
  const first=context(),response=await GET(first),reader=response!.body!.getReader(),decode=new TextDecoder();
  expect(decode.decode((await reader.read()).value)).toContain(': current assignment snapshot');
  const next=reader.read();const checked=expect(next).resolves.toMatchObject({done:false});
  await vi.advanceTimersByTimeAsync(5000);await checked;
  const message=decode.decode((await next).value);expect(message).toContain('event: atlas.unavailable');
  expect(message).toContain('"status":503');expect(message).not.toContain('private upstream diagnostic');
  expect((await reader.read()).done).toBe(true);expect(vi.getTimerCount()).toBe(0);
  snapshot.mockResolvedValue({revision:'two'});const abort=new AbortController(),fresh=context(abort),reconnected=await GET(fresh);
  const freshReader=reconnected!.body!.getReader();expect(decode.decode((await freshReader.read()).value)).toContain('"revision":"two"');
  expect(snapshot.mock.calls.map(call=>call[0])).toEqual([first,first,fresh]);
  abort.abort();expect((await freshReader.read()).done).toBe(true);expect(vi.getTimerCount()).toBe(0);
 });
 it('retains scope and signals only changed snapshots; abort closes the polling timer',async()=>{
  vi.useFakeTimers();snapshot.mockResolvedValueOnce({revision:'one'}).mockResolvedValue({revision:'two'});
  const abort=new AbortController(),scope=context(abort),response=await GET(scope);
  const reader=response!.body!.getReader();const decode=new TextDecoder();
  expect(decode.decode((await reader.read()).value)).toContain(': current assignment snapshot');
  await vi.advanceTimersByTimeAsync(5000);
  expect(decode.decode((await reader.read()).value)).toContain('"revision":"two"');
  expect(snapshot.mock.calls.every(call=>call[0]===scope)).toBe(true);
  abort.abort();await vi.advanceTimersByTimeAsync(20000);
  expect(snapshot).toHaveBeenCalledTimes(2);expect(vi.getTimerCount()).toBe(0);expect((await reader.read()).done).toBe(true);
 });
 it('closes a consumer that stops reading instead of growing an unbounded output queue',async()=>{
  vi.useFakeTimers();snapshot.mockResolvedValue({revision:'two'});
  const response=await GET(context());await vi.advanceTimersByTimeAsync(5000);
  await expect(response!.body!.getReader().read()).rejects.toThrow();expect(vi.getTimerCount()).toBe(0);
 });
 it('does not create a stream or timer when canonical preflight fails',async()=>{
  vi.useFakeTimers();snapshot.mockRejectedValue(new Error('incomplete inventory'));
  const response=await GET(context());expect(response!.status).toBe(503);expect(vi.getTimerCount()).toBe(0);
 });
});
