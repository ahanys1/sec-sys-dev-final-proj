"""SR-9: compare secret sentinels privately; emit booleans/counts only."""
import json,pathlib,subprocess
root=pathlib.Path('/tmp/team13-slice7');f=json.loads((root/'accounts.json').read_text())
r=subprocess.run(['docker','logs','team13-slice7-app-1'],capture_output=True,check=True)
logs=(r.stdout+r.stderr).decode()
secrets=[]
for a in f['accounts']:secrets.extend([a['password'],a['cookie'],a['cookie'].split('=',1)[1]])
for line in (root/'runtime.env').read_text().splitlines():
 if 'PASSWORD=' in line:secrets.append(line.split('=',1)[1])
events=[]
for line in logs.splitlines():
 try: events.append(json.loads(line))
 except ValueError: pass
result={'unhandled_login_errors':sum(x.get('event')=='request.unhandled' and x.get('route')=='auth.login' for x in events),'checked_sentinels':len(set(secrets)),'secret_matches':sum(s in logs for s in set(secrets)),'description_matches':sum(s in logs for s in ['Synthetic performance fixture','<script>window.synthetic=1</script>']),'unexpected_error_logged':'request.unhandled' in logs}
(root/'log-results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
