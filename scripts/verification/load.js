import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
const fixture=JSON.parse(open('/evidence/accounts.json'));
const read=new Trend('read_ms',true), write=new Trend('write_ms',true), login=new Trend('login_ms',true);
const errors=new Rate('action_errors'), limited=new Counter('rate_limited');
export const options={insecureSkipTLSVerify:true,stages:[{duration:'1m',target:50},{duration:'5m',target:50}],thresholds:{read_ms:['p(95)<=2000'],write_ms:['p(95)<=2000'],login_ms:['p(95)<=2000'],action_errors:['rate<0.01']}};
export default function workload(){
 const a=fixture.accounts[__VU-1],base='https://verify.local';
 const slot=__ITER%10;
 const params={headers:{Cookie:a.cookie,Origin:base,'Content-Type':'application/json'},tags:{action:slot<7?'read':slot<9?'write':'login'},redirects:0};
 let r,expected;
 if(slot<7){r=http.get(base+'/api/incidents',params);read.add(r.timings.duration);expected=200;}
 else if(slot<9){r=http.post(base+'/api/incidents',JSON.stringify({title:`Synthetic load ${__VU}-${__ITER}`,description:'Synthetic performance fixture',categoryId:fixture.categoryId}),params);write.add(r.timings.duration);expected=201;}
 else {r=http.post(base+'/api/auth/login',JSON.stringify({username:a.username,password:a.password}),params);login.add(r.timings.duration);expected=200;if(r.status===200 && r.cookies['__Host-session']) a.cookie='__Host-session='+r.cookies['__Host-session'][0].value;}
 const ok=check(r,{'expected status':r=>r.status===expected});errors.add(!ok);if(r.status===429)limited.add(1);
 sleep(1+(__VU+__ITER)%3);
}
export function handleSummary(data){return {'/evidence/k6-summary.json':JSON.stringify(data,null,2)};}
