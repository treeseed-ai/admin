import type {APIRoute} from 'astro';
import {atlasContext,atlasProjection,atlasJson,atlasError} from '../../../../view-models/agent-lab/atlas-response.ts';
import {row,string} from '../../../../view-models/agent-lab/atlas-snapshot.ts';
export const prerender=false;
export const GET:APIRoute=async context=>{try{
 const {api,team}=await atlasContext(context),snapshot=await atlasProjection(context);
 const graph=row(await api.request('GET',`/v1/teams/${encodeURIComponent(team.id)}/execution-graph`));
 if(graph.teamId!==team.id||!Array.isArray(graph.nodes)||!Array.isArray(graph.edges))throw new Error('Canonical execution graph is unavailable.');
 const nodes=graph.nodes.map(row).filter(node=>snapshot.scope.workdayIds.includes(string(node.workdayId)));
 const ids=new Set(nodes.map(node=>string(node.id)));
 return atlasJson([{id:team.id,status:'observed',nodes:nodes.map(node=>({id:node.id,status:node.status,targetAgentClass:node.agentClass,progressPercent:null,assignmentIds:snapshot.assignments.filter(a=>a.graphNodeId===node.id).map(a=>a.id)})),edges:graph.edges.map(row).filter(edge=>ids.has(string(edge.fromNodeId))&&ids.has(string(edge.toNodeId))).map(edge=>({fromNodeId:edge.fromNodeId,toNodeId:edge.toNodeId,edgeType:edge.provenance}))}]);
}catch(error){return atlasError(error);}};
