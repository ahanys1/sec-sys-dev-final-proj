"""NFR-5/6, FR-12: restore into a new DB; never drop/overwrite the source."""
import subprocess,json,time,pathlib,secrets,hashlib,http.client,ssl,socket
root=pathlib.Path('/tmp/team13-slice7'); container='team13-slice7-db-1'
def run(args,**kw):return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,**kw).stdout
def sql(query,db='incidents',role='app_owner'):
 return run(['docker','exec','-i',container,'psql','-XAt','-v','ON_ERROR_STOP=1','-U',role,'-d',db],input=query.encode()).decode().strip()
def fingerprint(db):
 result={}
 for table in ['users','categories','incidents','comments','audit_log','settings','sessions','login_attempts']:
  data=sql(f'SELECT row_to_json(t)::text FROM {table} t ORDER BY id;',db)
  result[table]={'rows':len(data.splitlines()) if data else 0,'sha256':hashlib.sha256(data.encode()).hexdigest()}
 return result
integrity={'missing_incident_audits':int(sql("SELECT count(*) FROM incidents i WHERE title LIKE 'Synthetic load %' AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.target_id=i.id::text AND a.action='incident.create')")), 'orphan_comments':int(sql('SELECT count(*) FROM comments c LEFT JOIN incidents i ON i.id=c.incident_id WHERE i.id IS NULL'))}
before=fingerprint('incidents');started=time.monotonic()
key=root/'backup.key';key.write_text(secrets.token_hex(32));key.chmod(0o600)
dump=run(['docker','exec',container,'pg_dump','-U','app_owner','-d','incidents','-Fc'])
enc=run(['openssl','enc','-aes-256-cbc','-salt','-pbkdf2','-iter','200000','-pass',f'file:{key}'],input=dump)
backup=root/'synthetic-backup.dump.enc';backup.write_bytes(enc);backup.chmod(0o600)
# Fresh restore database; abort if it already exists.
restore_db='slice7_restore_'+secrets.token_hex(4)
sql(f'CREATE DATABASE {restore_db} OWNER app_owner;',db='postgres',role='bootstrap_admin')
plain=run(['openssl','enc','-d','-aes-256-cbc','-pbkdf2','-iter','200000','-pass',f'file:{key}'],input=enc)
run(['docker','exec','-i',container,'pg_restore','--exit-on-error','-U','app_owner','-d',restore_db],input=plain)
after=fingerprint(restore_db)
restore_seconds=time.monotonic()-started
checks=[]
for statement in ['UPDATE audit_log SET action=action','DELETE FROM audit_log','TRUNCATE audit_log']:
 try: sql(statement,db=restore_db,role='app_user');checks.append(False)
 except subprocess.CalledProcessError:checks.append(True)
# Outage only the disposable verification DB; ensure it is restarted even on assertion failure.
a=json.loads((root/'accounts.json').read_text())['accounts'][51]
def request():
 c=http.client.HTTPSConnection('verify.local',8443,context=ssl.create_default_context(cafile=str(root/'local-ca.crt')),timeout=40)
 c.sock=ssl.create_default_context(cafile=str(root/'local-ca.crt')).wrap_socket(socket.create_connection(('127.0.0.1',8443),timeout=40),server_hostname='verify.local')
 c.request('GET','/api/admin/settings',headers={'Host':'verify.local','Cookie':a['cookie']})
 r=c.getresponse();body=r.read().decode();c.close();return r.status,body
outage_start=time.monotonic()
try:
 run(['docker','stop',container]);status,body=request()
finally:run(['docker','start',container])
recovered=False
for _ in range(30):
 try:
  if request()[0]==200:recovered=True;break
 except (OSError,http.client.HTTPException):pass
 time.sleep(1)
result={'integrity':integrity,'backup_bytes':len(enc),'source_equals_restore':before==after,'tables':before,'restore_seconds':restore_seconds,'restore_under_one_hour':restore_seconds<3600,'restored_audit_mutations_denied':all(checks),'outage_status':status,'outage_generic':status==500 and not any(s in body for s in ['Prisma','postgres','SELECT','password']),'recovered':recovered,'outage_recovery_seconds':time.monotonic()-outage_start}
(root/'recovery-results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
