import {PlatformOperations} from '@treeseed-cordis/sdk';
import {UiSchemas,type UiViewModel} from '@treeseed-cordis/ui/contracts';
export class AdminPackageIdentity {
 static readonly version = '0.0.0-cordis.11';
 static readonly artifact = '@treeseed-cordis/admin@' + this.version;
}
export class AdminViews {
 static initial(installationId:string,csrf:string):UiViewModel{return UiSchemas.view.parse({id:'admin.page',componentId:'stack',model:{title:'Cordis installed status',children:[{id:'admin.installation',componentId:'text',model:{text:'Installation '+installationId}},{id:'admin.status',componentId:'status',model:{title:'Installed status',state:'Loading'}},{id:'admin.refresh',componentId:'form',model:{title:'Status',actionId:'admin.refresh',submitLabel:'Refresh status',fields:[]}},{id:'admin.logout',componentId:'form',model:{title:'Session',actionId:'admin.logout',submitLabel:'Sign out',actionData:{csrf},fields:[]}}]}});}
 static refreshed(view:UiViewModel,value:unknown):UiViewModel{const stack=UiSchemas.stackModel.parse(view.model),result=PlatformOperations.status.parseOutput(value),children:UiViewModel[]=[];for(const child of stack.children)if(child.id!=='admin.status'&&child.id!=='admin.services')children.push(child);children.splice(1,0,{id:'admin.status',componentId:'status',model:{title:'Installed status',state:result.ready?'Ready':'Not ready',detail:result.activeComposition??'No active composition'}});const rows:string[][]=[];if('services' in result)for(const service of result.services)rows.push([service.serviceId,service.ready?'Ready':'Not ready']);children.splice(2,0,{id:'admin.services',componentId:'table',model:{title:'Services',columns:['Service','State'],rows}});return UiSchemas.view.parse({...view,model:{...stack,children}});}
}
