import {expect,it,vi} from 'vitest';
import {providerPermissions} from '../../src/view-models/provider-permissions';
it('only reads grants for the selected provider and preserves missing grants',async()=>{
 const request=vi.fn().mockResolvedValueOnce({items:[{id:'a',capacityProviderId:'p'},{id:'b',capacityProviderId:'other'}],cursor:null}).mockRejectedValueOnce({status:404});
 expect(await providerPermissions({request},'t','p')).toMatchObject({grants:[],assignments:[{id:'a'}]});expect(request).toHaveBeenCalledTimes(2);
});
it('does not turn permission/service failures into an empty grant list',async()=>{
 const request=vi.fn().mockResolvedValueOnce({items:[{id:'a',capacityProviderId:'p'}],cursor:null}).mockRejectedValueOnce({status:403});
 await expect(providerPermissions({request},'t','p')).rejects.toMatchObject({status:403});
});
it('rejects a grant for another team or provider',async()=>{
 const request=vi.fn().mockResolvedValueOnce({items:[{id:'a',capacityProviderId:'p'}],cursor:null}).mockResolvedValueOnce({teamId:'other',providerId:'p',assignmentId:'a'});
 await expect(providerPermissions({request},'t','p')).rejects.toThrow('scope mismatch');
});
