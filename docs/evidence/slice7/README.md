# Local Slice 7 verification

Team #13

Fresh verification from main `17158b2`, independent of PR #56. Local-only authorization; no live scans or deployment. Results are being collected in PR #63. Sanitized summaries belong here; raw scanner reports, synthetic credentials, dumps and runtime env stay in `/tmp/team13-slice7` (private directory) and must not be committed.

## Reproduce

Requirements: Docker, Node 24, Python 3, OpenSSL. Start with an unused `/tmp/team13-slice7` directory and no existing `team13-slice7` Compose project. Preserve earlier evidence before starting another run. The existing normal local stack is independent.

1. `make verify-local` (optionally `EXTRA_CA_CERT=/absolute/trusted-ca.pem make verify-local` on a TLS-inspecting network). Builds the production image, migrates a fresh database and seeds 52 synthetic accounts plus 1,000 incidents. Only local port 8443 is published.
2. `make verify-sast`; `npm run lint`; `npx tsc --noEmit`; `npm test`; `make test-db`; `npm audit --omit=dev`.
3. `make verify-http` runs deterministic HTTP authorization, origin, malformed body/query, safe-rendering and native-form probes.
4. `make verify-load` runs k6 at 50 VUs, one-minute ramp and five-minute hold, 1–3 second think time, 70/20/10 reads/writes/logins. App and DB each have one CPU and 1 GiB; app pool remains 10. The disposable load generator uses 50 actual source IPs; rate limits and Caddy's forwarding-header replacement remain enabled. Do not run scanners or database tests concurrently with this measurement.
5. `make verify-recovery` dumps with `pg_dump -Fc`, encrypts the synthetic backup, restores into a **new** `slice7_restore` database, compares table fingerprints, tests restored audit immutability, and stops/restarts **only** `team13-slice7-db-1` to check generic errors and recovery. It refuses to overwrite an existing restore database. The source is not dropped. This drill is not a production backup service and does not demonstrate a scheduled 24-hour RPO.
6. Refresh disposable sessions after login load: `scripts/verification/compose.sh run --rm create-admin npx tsx scripts/verification/refresh.ts`. Then `make verify-zap` for authenticated passive/spider scans of all roles. Sessions are explicitly provisioned fixtures; automated login discovery is not claimed. Raw reports may include synthetic session values and remain private.
7. Stop the isolated stack with `scripts/verification/compose.sh down`. Keep its volumes and private evidence until review; deletion is a separate operator decision.

The local certificate is issued by the disposable Caddy CA. Test clients disable certificate trust validation for this isolated endpoint; this is not evidence of public certificate trust. HTTPS is still used. Container images for Postgres, Node, Caddy, Semgrep, ZAP and k6 are pinned by digest in the Compose/Dockerfile/scripts. Semgrep registry rules are fetched at execution; preserve scanner version and ruleset evidence with the run.

References: [ZAP authentication headers](https://www.zaproxy.org/docs/getting-further/authentication/handling-auth-yourself/), [k6 source IP assignment](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#local-ips). Neither tool's configuration alone proves test coverage; consult the result summaries and limitations.

## Findings and interpretation

- **F-01, native GET fallback (SR-16 / ASVS V14.2.1):** the first ZAP crawl submitted the login form as `/login?password=ZAP&username=ZAP`. Source inspection confirmed all six forms relied solely on JavaScript `preventDefault` and omitted `method`. Fixed by declaring POST on all six; final rendered-HTML checks and repeat scans validate the change. JavaScript-disabled use remains unsupported, but the fallback must not disclose fields in URLs.
- **F-02, shared-IP load limitation (NFR-3/4):** the initial diagnostic shared one source IP across 50 users and reached the documented 20-logins/15-minute limit. It was stopped early (not an acceptance run). All observed diagnostic failures were 429s. The acceptance baseline assigns 50 real source IPs through k6's `--local-ips`; headers are not spoofed and controls are not weakened. Shared-NAT users can still hit the documented aggregate limit; this is an operational limitation, not a universal claim of 50-user success from one IP.
- **ZAP 10044, large redirect:** review the anonymous root redirect body for sensitive content; a framework-generated redirect body alone is not evidence of disclosure.
- **ZAP 90004, COEP:** low-severity missing cross-origin isolation header. No SharedArrayBuffer/cross-origin-isolated feature is used. Record the finding; no new accepted-risk decision is implied.
- Cache/no-store and modern-web-app informational alerts require interpretation: protected data intentionally uses no-store, and fingerprinted static assets may be cached. Passive spider discovery does not exercise all JavaScript-driven writes.

## Coverage limits

This is local evidence only. No live-host scanning, live migration, or release approval is performed. HTTP probes cover server responses and escaped HTML; they are not a fresh interactive-browser execution of every UI case. Deterministic malformed-body/query cases are bounded fuzz inputs, not an exhaustive fuzz campaign. ZAP role scans use externally provisioned sessions and passive/spider scanning, not a broad active attack scan. Local Semgrep is executed; the CodeQL CLI is unavailable on this host, so fresh CI CodeQL results are identified separately. Backup encryption is a disposable synthetic-data drill (private random key, AES-256-CBC/PBKDF2); production key custody, integrity-protected backup storage, retention and scheduled RPO enforcement remain operational work.
