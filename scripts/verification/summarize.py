"""Export only allowlisted summaries; never copy requests, cookies, descriptions or credentials."""
import json,pathlib
root=pathlib.Path('/tmp/team13-slice7');out=pathlib.Path('docs/evidence/slice7');out.mkdir(parents=True,exist_ok=True)
result={}
for name in ['http-results','recovery-results','log-results','surface-results']:
 p=root/(name+'.json')
 if p.exists():result[name]=json.loads(p.read_text())
for name in ['k6-summary','k6-single-ip-summary','k6-before-retry-summary']:
 p=root/(name+'.json')
 if p.exists():
  data=json.loads(p.read_text());result[name]={k:v for k,v in data['metrics'].items() if k in ['read_ms','write_ms','login_ms','action_errors','rate_limited','http_reqs','iterations','vus','vus_max','http_req_failed']}
p=root/'semgrep.json'
if p.exists():
 d=json.loads(p.read_text());result['semgrep']={'version':d['version'],'scanned_files':len(d['paths']['scanned']),'findings':len(d['results']),'errors':len(d['errors'])}
for p in root.glob('zap-*.json'):
 d=json.loads(p.read_text());result[p.stem]={'version':d.get('@version'),'alerts':[{'id':a['pluginid'],'name':a['name'],'risk':a['riskdesc'],'count':a.get('count')} for s in d.get('site',[]) for a in s.get('alerts',[])]}
p=root/'npm-audit.json'
if p.exists():result['production_audit']=json.loads(p.read_text()).get('metadata',{}).get('vulnerabilities',{})
(out/'results.json').write_text(json.dumps(result,indent=2)+'\n')
print('Sanitized summaries written; review before committing.')
