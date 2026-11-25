"""SR-4/7/12/16: synthetic HTTP misuse and malformed-input probes; local only."""
import http.client,ssl,json,pathlib,socket
root=pathlib.Path('/tmp/team13-slice7')
f=json.loads((root/'accounts.json').read_text()); users=f['accounts']; results=[]
def req(method,path,body=None,account=None,headers=None):
 c=http.client.HTTPSConnection('verify.local',8443,context=ssl.create_default_context(cafile=str(root/'local-ca.crt')),timeout=20)
 c.sock=ssl.create_default_context(cafile=str(root/'local-ca.crt')).wrap_socket(socket.create_connection(('127.0.0.1',8443),timeout=20),server_hostname='verify.local')
 h={'Host':'verify.local','Origin':'https://verify.local','Content-Type':'application/json'}
 if account:h['Cookie']=account['cookie']
 h.update(headers or {})
 c.request(method,path,json.dumps(body) if body is not None else None,h)
 r=c.getresponse();data=r.read().decode();status=r.status;c.close();return status,data
def test(name,method,path,expected,body=None,account=None,headers=None):
 status,data=req(method,path,body,account,headers)
 safe=not any(s in data for s in ['PrismaClient','password_hash','postgresql://',' at async '])
 results.append({'name':name,'status':status,'expected':expected,'pass':status in expected and safe})
 return data
u,reviewer,admin=users[0],users[50],users[51]
incident=json.loads(test('create incident','POST','/api/incidents',[201],{'title':'Synthetic verification','description':'<script>window.synthetic=1</script>','categoryId':f['categoryId']},u))['incident']['id']
test('anonymous list','GET','/api/incidents',[401])
test('user admin API','GET','/api/admin/users',[403],account=u)
test('reviewer admin API','GET','/api/admin/settings',[403],account=reviewer)
test('user own detail denied','GET','/api/incidents/'+incident,[404],account=u)
test('foreign detail denied','GET','/api/incidents/'+incident,[404],account=users[1])
test('admin reviewer transition denied','PATCH',f'/api/incidents/{incident}/status',[403],{'status':'under_review'},admin)
test('self role denied','PATCH',f"/api/admin/users/{admin['id']}/role",[403],{'role':'user'},admin)
test('reviewer transition','PATCH',f'/api/incidents/{incident}/status',[200],{'status':'under_review'},reviewer)
test('user comments denied','POST',f'/api/incidents/{incident}/comments',[403],{'body':'synthetic'},u)
test('reviewer comment','POST',f'/api/incidents/{incident}/comments',[201],{'body':'<script>window.synthetic=1</script>'},reviewer)
test('foreign origin','POST','/api/incidents',[403],{},u,{'Origin':'https://invalid.example'})
test('missing origin','POST','/api/incidents',[403],{},u,{'Origin':''})
test('null origin','POST','/api/incidents',[403],{},u,{'Origin':'null'})
test('simple form content type','POST','/api/incidents',[415],{},u,{'Content-Type':'application/x-www-form-urlencoded'})
test('middleware bypass','GET','/api/admin/users',[400],headers={'x-middleware-subrequest':'middleware:middleware:middleware:middleware:middleware'})
page=test('stored text server escaping','GET',f'/reviewer/incidents/{incident}',[200],account=reviewer)
results.append({'name':'stored script escaped in HTML','pass':'<script>window.synthetic=1</script>' not in page and '&lt;script&gt;' in page})
for path in ['/api/incidents?page=-1','/api/incidents?limit=100000','/api/incidents?page=NaN','/api/incidents?page=1&page=2']:
 test('query fuzz '+path,'GET',path,[400],account=u)
# Direct endpoint authorization matrix for every administrative route family.
admin_routes=[('GET','/api/admin/users',None),('POST','/api/admin/users',{}),('GET','/api/admin/audit',None),('GET','/api/admin/settings',None),('PATCH','/api/admin/settings',{}),('GET','/api/admin/categories',None),('POST','/api/admin/categories',{}),('PATCH',f"/api/admin/categories/{f['categoryId']}",{})]
for suffix in ['', '/role','/status','/password-reset']:
 admin_routes.append(('POST' if suffix=='/password-reset' else 'PATCH',f"/api/admin/users/{users[2]['id']}"+suffix,{}))
for method,path,body in admin_routes:
 for a,expected in [(None,401),(u,403),(reviewer,403)]:test('admin matrix '+method+' '+path,method,path,[expected],body,a)
for path in ['/admin/users','/admin/audit','/admin/settings','/admin/categories','/admin/incidents']:
 for a in [u,reviewer]:test('page role denial '+path,'GET',path,[404],account=a)
test('oversize JSON body','POST','/api/incidents',[413],{'title':'x'*70000},u)
# Deterministic malformed corpus across all write-route families; failures must remain client errors.
paths=[('POST','/api/incidents',u),('POST',f'/api/incidents/{incident}/comments',reviewer),('PATCH',f'/api/incidents/{incident}/status',reviewer),('PATCH',f'/api/incidents/{incident}/category',reviewer),('PATCH','/api/admin/settings',admin),('POST','/api/admin/users',admin),('PATCH',f"/api/admin/users/{users[2]['id']}",admin),('PATCH',f"/api/admin/users/{users[2]['id']}/role",admin),('PATCH',f"/api/admin/users/{users[2]['id']}/status",admin),('POST','/api/admin/categories',admin),('PATCH',f"/api/admin/categories/{f['categoryId']}",admin),('POST','/api/account/password',u),('POST','/api/auth/login',None)]
for method,path,a in paths:
 for body in [[],{}, {'unexpected':'synthetic'}, {'__proto__':{'role':'admin'}},{'title':123,'role':['admin']}]:
  test('body fuzz '+method+' '+path,method,path,[400,401,403,404,405,429],body,a)
test('SQL injection login remains denied','POST','/api/auth/login',[400,401],{'username':"' OR 1=1 --",'password':'synthetic-invalid-credential'})
test('mass assignment role rejected','PATCH',f"/api/admin/users/{users[3]['id']}",[400],{'username':'verify_3','role':'admin'},admin)
test('logout','POST','/api/auth/logout',[200],{},users[49])
test('replay after logout','GET','/api/incidents',[401],account=users[49])
for path in ['/.env','/.env.keys','/.git/config']:
 test('secret path '+path,'GET',path,[404])
test('persist administrator setting','PATCH','/api/admin/settings',[200],{'statusMessage':'Synthetic verification status'},admin)
first=json.loads(test('audit page one','GET','/api/admin/audit?page=1&limit=25',[200],account=admin))
second=json.loads(test('audit page two','GET','/api/admin/audit?page=2&limit=25',[200],account=admin))
results.append({'name':'audit pagination beyond 25 records','pass':len(first.get('records',[]))==25 and len(second.get('records',[]))==25 and not ({r['id'] for r in first['records']} & {r['id'] for r in second['records']})})
# Inspect rendered native fallback methods, which must not serialize sensitive fields into GET URLs.
import re
for path,a in [('/login',None),('/account/password',admin),('/incidents/new',u),('/admin/users',admin),('/admin/settings',admin),(f'/reviewer/incidents/{incident}',reviewer)]:
 status,html=req('GET',path,account=a)
 forms=re.findall(r'<form\b[^>]*>',html)
 results.append({'name':'native POST fallback '+path,'pass':status==200 and bool(forms) and all('method="post"' in form for form in forms)})
(root/'http-results.json').write_text(json.dumps({'checks':results,'passed':sum(x['pass'] for x in results),'total':len(results)},indent=2))
print(json.dumps({'passed':sum(x['pass'] for x in results),'total':len(results),'failures':[x for x in results if not x['pass']]}))
