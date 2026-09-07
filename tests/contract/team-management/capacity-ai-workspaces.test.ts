import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
const read=(path:string)=>readFileSync('src/'+path,'utf8');
it('uses authoritative provider inventory rather than retired memberships or the command dashboard',()=>{
const page=read('pages/app/capacity/index.astro');
expect(page).toContain("'capacity-providers'");expect(page).not.toContain('capacity-provider-memberships');expect(page).not.toContain('loadCommandSnapshot');
expect(page).toContain('OperationalList');expect(page).toContain("['Overview','Permissions','Activity'");
});
it('reveals registration codes only after explicit action and sends mutation protections',()=>{
const page=read('pages/app/capacity/registration.astro');
expect(page).toContain("'private, no-store'");expect(page).toContain("'If-Match'");expect(page).toContain("'Idempotency-Key'");expect(page).toContain("'x-treeseed-csrf'");expect(page).not.toContain('localStorage');
});
it('reuses the UI wizard and keeps unpaid setup separate from cloud activation',()=>{
const page=read('pages/app/ai/new.astro');expect(page).toContain('ManagementWizard');expect(page).toContain("'services.connections.list'");expect(page).toContain('Save draft');expect(page).toContain('data-ai-review');expect(page).toContain("'If-Match'");expect(page).toContain('No machine has been provisioned.');
});
