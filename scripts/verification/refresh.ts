// Test-only session provisioning, never installed as an application endpoint (ASSUMP-2).
import {readFileSync,writeFileSync} from 'node:fs';
import {getDb} from '../../src/lib/db';
import {newToken,hashToken} from '../../src/lib/auth/session';
async function main(){
 const path='/evidence/accounts.json',f=JSON.parse(readFileSync(path,'utf8')),db=getDb();
 for(const a of f.accounts){
  const token=newToken();
  await db.session.create({data:{userId:a.id,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+86400000)}});
  a.cookie=`__Host-session=${token}`;
 }
 writeFileSync(path,JSON.stringify(f),{mode:0o600});await db.$disconnect();
}
main().catch(()=>{process.stderr.write('Session fixture refresh failed\n');process.exitCode=1;});
