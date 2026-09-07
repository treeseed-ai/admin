import {expect,it,vi} from 'vitest';
import {loadCursorItems} from '../../src/lib/operations/cursor-items';
it('reads every page and encodes cursor values',async()=>{
 const request=vi.fn().mockResolvedValueOnce({items:[{id:1}],page:{hasMore:true,nextCursor:'a+b'}}).mockResolvedValueOnce({items:[{id:2}],page:{hasMore:false,nextCursor:null}});
 expect(await loadCursorItems({request},'/inventory')).toEqual([{id:1},{id:2}]);expect(request.mock.calls[1][1]).toContain('a%2Bb');
});
it.each([{items:[]},{items:[null],cursor:null},{items:[],page:{hasMore:true,nextCursor:null}}])('rejects incomplete inventory metadata',async page=>{
 await expect(loadCursorItems({request:vi.fn(async()=>page)},'/inventory')).rejects.toThrow();
});
it('rejects cursor loops rather than returning duplicate rows',async()=>{
 await expect(loadCursorItems({request:vi.fn(async()=>({items:[],cursor:'repeat'}))},'/inventory')).rejects.toThrow('cursor');
});
it.each([{items:[],nextCursor:null},{items:[],cursor:null}])('accepts an explicitly terminated cursor page',async page=>{
 expect(await loadCursorItems({request:vi.fn(async()=>page)},'/inventory')).toEqual([]);
});
