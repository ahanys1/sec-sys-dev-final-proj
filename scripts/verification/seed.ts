// ASSUMP-2: explicit synthetic fixtures in the isolated verification project only.
import { writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { getDb } from '../../src/lib/db';
import { hashPassword } from '../../src/lib/auth/password';
import { newToken, hashToken } from '../../src/lib/auth/session';
async function main() {
 const db=getDb();
 if(await db.user.count()) throw new Error('Refusing to seed a nonempty database');
 const password=randomBytes(24).toString('base64url');
 const passwordHash=await hashPassword(password);
 const category=await db.category.create({data:{name:'Synthetic verification'}});
 const accounts: {id:string; username:string; role:string; password:string; cookie:string}[]=[];
 for(let i=0;i<52;i++) {
  const role=i===50?'reviewer':i===51?'admin':'user';
  const user=await db.user.create({data:{username:`verify_${i}`,role,passwordHash,mustChangePassword:false}});
  const token=newToken();
  await db.session.create({data:{userId:user.id,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+86400000)}});
  accounts.push({id:user.id,username:user.username,role,password,cookie:`__Host-session=${token}`});
 }
 await db.incident.createMany({data:Array.from({length:1000},(_,i)=>({reporterId:accounts[i%50].id,title:`Synthetic baseline ${i}`,description:'Synthetic verification text only',categoryId:category.id,status:i%3===0?'closed':'open'}))});
 writeFileSync('/evidence/accounts.json',JSON.stringify({accounts,categoryId:category.id}),{mode:0o600});
 await db.$disconnect();
 process.stdout.write('Seeded 52 synthetic accounts and 1000 incidents; credentials saved privately.\n');
}
main().catch(()=>{process.stderr.write('Fixture setup failed\n');process.exitCode=1;});
