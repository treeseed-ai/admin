import {describe,expect,it} from 'vitest';
import type {APIContext} from 'astro';
import {applicationRequest} from '../../../src/lib/auth/application-session.ts';
import {createApplicationSession} from '@treeseed/identity';

function context(url='http://admin.test/app/work?date=2026-10-17',mode='live',session='dev-example'){
 return {locals:{runtime:{env:{TREESEED_SITE_URL:'https://admin.test',TREESEED_DEVELOPMENT_MODE:mode,TREESEED_DEVELOPMENT_SESSION_ID:session}}},
  request:new Request(url,{headers:{cookie:`__Host-test=${'a'.repeat(43)}`}})} as unknown as APIContext;
}
describe('configured Admin public origin on the development HTTP transport',()=>{
 it('retains the public HTTPS origin, path, query and opaque cookie for the same configured host',()=>{
  const request=applicationRequest(context());expect(request.url).toBe('https://admin.test/app/work?date=2026-10-17');
  expect(request.headers.get('cookie')).toBe(`__Host-test=${'a'.repeat(43)}`);
 });
 it('preserves an already canonical request without cloning',()=>{
  const value=context('https://admin.test/app/work');expect(applicationRequest(value)).toBe(value.request);
 });
 it.each(['http://foreign.test/app','http://admin.test:1234/app','https://foreign.test/app'])('denies unrelated origin %s',url=>{
  expect(()=>applicationRequest(context(url))).toThrow();
 });
 it.each([['released','dev-example'],['live',''],['live','other-session']])('denies HTTP outside the explicitly selected development transport (%s,%s)',(mode,session)=>{
  expect(()=>applicationRequest(context(undefined,mode,session))).toThrow();
 });
 it('cannot gain authority from forged forwarded headers',()=>{
  const value=context('http://foreign.test/app');value.request.headers.set('x-forwarded-host','admin.test');value.request.headers.set('x-forwarded-proto','https');
  expect(()=>applicationRequest(value)).toThrow();
 });
 it('passes the real Identity origin guard while retaining logout Origin denial',async()=>{
  const calls:unknown[]=[];
  const bridge=createApplicationSession({resource:'https://api.test',issuer:'https://identity.test',callbackUrl:'https://admin.test/auth/callback',afterLogin:'/app',cookieName:'__Host-test',
   credentials:{token:async()=> 'synthetic-token'},transport:async(input,init)=>{calls.push({input,init});return Response.json({error:'browser_session_unavailable'},{status:401});}});
  await expect(bridge.session(context().request)).rejects.toThrow();expect(calls).toEqual([]);
  await expect(bridge.session(applicationRequest(context()))).resolves.toBeNull();expect(calls).toHaveLength(1);
  const value=context();value.request=new Request(value.request.url,{method:'POST',headers:{origin:'https://foreign.test'}});
  await expect(bridge.logout(applicationRequest(value))).rejects.toThrow();expect(calls).toHaveLength(1);
 });
});
