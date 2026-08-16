import { describe,expect,it,vi } from 'vitest';
import { resolveClientAction } from '../../../src/lib/agents/client-action-executor.ts';

describe('semantic client action executor',()=>{
	it('allows only authenticated application navigation paths',()=>{
		expect(resolveClientAction({id:'a',kind:'navigate',payload_json:'{"path":"/app/projects/project-a"}'},vi.fn()))
			.toEqual({path:'/app/projects/project-a'});
		expect(()=>resolveClientAction({id:'b',kind:'navigate',payload_json:'{"path":"https://example.com"}'},vi.fn()))
			.toThrow('authenticated application routes');
	});

	it.each(['reveal-resource','set-view-filter','populate-draft','present-confirmation'])('emits the bounded %s event',kind=>{
		const emit=vi.fn();
		expect(resolveClientAction({id:kind,kind,payload_json:'{"resourceId":"proposal-a"}'},emit)).toEqual({resourceId:'proposal-a'});
		expect(emit).toHaveBeenCalledWith(`treeseed:client-action:${kind}`,{resourceId:'proposal-a'});
	});

	it('rejects unsupported actions and malformed payloads without executing code',()=>{
		const emit=vi.fn();
		expect(()=>resolveClientAction({id:'x',kind:'javascript',payload_json:'{"code":"alert(1)"}'},emit)).toThrow('Unsupported semantic client action');
		expect(emit).not.toHaveBeenCalled();
	});
});
