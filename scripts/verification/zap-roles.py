"""Authenticated passive/spider scans. Credentials stay in private env files, not argv/reports."""
import json,pathlib,subprocess
root=pathlib.Path('/tmp/team13-slice7');f=json.loads((root/'accounts.json').read_text())
for index,path in [(0,'/incidents'),(50,'/reviewer/incidents'),(51,'/admin/audit')]:
 a=f['accounts'][index];role=a['role'];env=root/f'zap-{role}.env'
 env.write_text('ZAP_AUTH_HEADER=Cookie\nZAP_AUTH_HEADER_VALUE='+a['cookie']+'\nZAP_AUTH_HEADER_SITE=verify.local\n');env.chmod(0o600)
 args=['docker','run','--rm','--network','team13-slice7_public','--env-file',str(env),'-v',str(root)+':/zap/wrk:rw','ghcr.io/zaproxy/zaproxy@sha256:9624669db72f54d86c4b46a7064518bd9bf79d8c61a4c31befa9923489f328af','zap-baseline.py','-t','https://verify.local'+path,'-m','1','-J',f'zap-{role}.json']
 with (root/f'zap-{role}.log').open('w') as log: r=subprocess.run(args,stdout=log,stderr=subprocess.STDOUT)
 print(role,'scanner exit',r.returncode,flush=True)
 env.unlink()
