import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({invoke:vi.fn(),app:vi.fn()}));
vi.mock('../../src/lib/market/api-client',()=>({ApiClientFacade:class {invoke=mocks.invoke},resolveApiBaseUrl:()=> 'https://api.example.test'}));
vi.mock('../../src/view-models/app-access',()=>({loadAppContext:mocks.app}));
import {POST} from '../../src/pages/app/capacity/install-download';
function context(signedIn=true,csrf='csrf-fixture',teamId='team'){
  const form=new FormData();form.set('csrfToken',csrf);form.set('teamId',teamId);
  return {locals:{auth:signedIn?{principal:{id:'user'}}:null},request:new Request('https://admin.example.test/app/capacity/install-download',{method:'POST',body:form}),cookies:{get:()=>({value:'csrf-fixture'})}} as any;
}
describe('team installation download',()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.app.mockResolvedValue({activeTeam:{id:'team'}});mocks.invoke.mockResolvedValue({generation:1,registrationCode:'registration-code-fixture'});});
  it('returns a no-store attachment through the existing authorized operation',async()=>{
    const response=await POST(context());expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    const body=await response.json();expect(body.inputs.teamRegistrationCode).toBe('registration-code-fixture');
    expect(body.hostId).toBeUndefined();expect(mocks.invoke.mock.calls[0][0].descriptor.operationId).toBe('providers.registration.code.reveal');
  });
  it('rejects unsigned, forged-CSRF and switched-team requests before revealing',async()=>{
    for(const [request,status] of [[context(false),401],[context(true,'wrong'),403],[context(true,'csrf-fixture','other'),409]] as const){
      expect((await POST(request)).status).toBe(status);
    }
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('preserves API denial and never echoes upstream material',async()=>{
    mocks.invoke.mockRejectedValue(Object.assign(new Error('credential-fixture'),{status:403}));
    const response=await POST(context());expect(response.status).toBe(403);expect(await response.text()).not.toContain('credential-fixture');
  });
});
