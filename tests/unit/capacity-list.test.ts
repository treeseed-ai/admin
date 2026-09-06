import {expect,it} from 'vitest';
import {capacityRows} from '../../src/view-models/capacity-list';
const provider={providerId:'p',status:'approved'};
it('does not count approval as a live provider',()=>{
expect(capacityRows([provider],[],[])[0].status).toBe('Unknown');
expect(capacityRows([provider],[{providerId:'p',status:'expired',expiresAt:'2020-01-01'}],[])[0].status).toBe('Offline');
});
it('requires a fresh active report and uses the actual reported worker counts',()=>{
const rows=capacityRows([provider],[{providerId:'p',status:'active',expiresAt:'2030-01-01',snapshot:{availableWorkers:2,activeAssignmentIds:['a']}}],[],0);
expect(rows[0].status).toBe('Online');expect(rows[0].description).toContain('2 workers available · 1 running');
});
it('shows only pending requests, alongside memberships rather than duplicate sessions',()=>{
const rows=capacityRows([provider],[],[{id:'a',status:'approved'},{id:'b',status:'pending'}]);
expect(rows).toHaveLength(2);expect(rows[0].status).toBe('Pending approval');
});
it('does not report a suspended provider as online',()=>{
expect(capacityRows([{...provider,status:'suspended'}],[{providerId:'p',status:'active',expiresAt:'2030-01-01'}],[],0)[0].status).toBe('suspended');
});
