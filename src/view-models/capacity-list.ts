export function capacityRows(providers:any[],sessions:any[],requests:any[],now=Date.now()) {
const rows=providers.map(provider=>{
const session=sessions.filter(item=>item.providerId===provider.providerId).sort((a,b)=>Date.parse(b.refreshedAt??b.openedAt)-Date.parse(a.refreshedAt??a.openedAt))[0];
const online=session?.status==='active'&&Date.parse(session.expiresAt)>now;
const status=provider.status!=='approved'?provider.status:!session?'Unknown':online?'Online':'Offline';
return {id:provider.providerId,name:provider.teamAlias??provider.displayName??'Capacity provider',status,
description:online?`${session.snapshot?.availableWorkers??'Unknown'} workers available · ${session.snapshot?.activeAssignmentIds?.length??'Unknown'} running assignments`:session?'Availability expired. This provider cannot accept new work.':'No availability report received.',
href:`/app/capacity?provider=${encodeURIComponent(provider.providerId)}`,meta:provider.providerId};
});
return [...requests.filter(request=>request.status==='pending').map(request=>({id:request.id,name:request.displayName??'New provider request',status:'Pending approval',description:'Review this identity and its offered capabilities before approving.',href:`/app/capacity?request=${encodeURIComponent(request.id)}`,meta:request.providerId})),...rows];
}
