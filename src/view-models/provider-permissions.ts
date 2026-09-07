import {loadCursorItems} from '../lib/operations/cursor-items';
/** Descriptor-only projection. Never reads provider-local variable values. */
export async function providerPermissions(api:{request:(method:string,path:string)=>Promise<any>},teamId:string,providerId:string){
 const base='/v1/teams/'+encodeURIComponent(teamId);
 const assignments=(await loadCursorItems(api,base+'/capacity/assignments')).filter(assignment=>assignment.capacityProviderId===providerId);
 const grants=[];
 for(const assignment of assignments){
  try{const grant=await api.request('GET',base+'/assignments/'+encodeURIComponent(assignment.id)+'/environment-grant');
   if(grant.providerId!==providerId||grant.teamId!==teamId||grant.assignmentId!==assignment.id)throw new Error('Environment grant scope mismatch.');
   grants.push({assignment,grant});
  }catch(error){if(Number((error as any)?.status)!==404)throw error;}
 }
 return {assignments,grants};
}
