/** Read complete inventories; never present a truncated or malformed page as an empty fleet. */
export async function loadCursorItems(api:{request:(method:string,path:string)=>Promise<any>},path:string):Promise<any[]> {
 const rows:any[]=[],seen=new Set<string>();let cursor:string|null=null;
 for(let pageIndex=0;pageIndex<100;pageIndex++){
  const separator=path.includes('?')?'&':'?';
  const page=await api.request('GET',path+separator+'limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):''));
  if(!page||!Array.isArray(page.items)||page.items.some((row:unknown)=>!row||typeof row!=='object'||Array.isArray(row)))throw new Error('Invalid inventory page.');
  rows.push(...page.items);
  const next=page.page&&'nextCursor' in page.page?page.page.nextCursor:'nextCursor' in page?page.nextCursor:page.cursor;
  const hasMore=page.page?.hasMore;
  if(hasMore===false||hasMore!==true&&next===null)return rows;
  if(typeof next!=='string'||!next||seen.has(next))throw new Error('Invalid inventory cursor.');
  seen.add(next);cursor=next;
 }
 throw new Error('Inventory pagination limit exceeded.');
}
