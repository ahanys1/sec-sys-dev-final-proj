# Local Slice 7 verification

Team #13

Fresh verification from main `17158b2`, independent of PR #56. Local-only authorization; no live scans or deployment. Results are being collected in PR #63. Sanitized summaries belong here; raw scanner reports, synthetic credentials, dumps and runtime env stay in `/tmp/team13-slice7` (private directory) and must not be committed.

## Reproduce

Requirements: Docker, Node 24, Python 3, OpenSSL. Start with an unused `/tmp/team13-slice7` directory and no existing `team13-slice7` Compose project. Preserve earlier evidence before starting another run. The existing normal local stack is independent.

1. `make verify-local` (optionally `EXTRA_CA_CERT=/absolute/trusted-ca.pem make verify-local` on a TLS-inspecting network). Builds the production image, migrates a fresh database and seeds 52 synthetic accounts plus 1,000 incidents. Only local port 8443 is published.
2. `make verify-sast`; `npm run lint`; `npx tsc --noEmit`; `npm test`; `make test-db`; `npm audit --omit=dev`.
3. `make verify-http` runs deterministic HTTP authorization, origin, malformed body/query, safe-rendering and native-form probes.
4. `make verify-load` runs k6 at 50 VUs, one-minute ramp and five-minute hold, 1–3 second think time, 70/20/10 reads/writes/logins. App and DB each have one CPU and 1 GiB; app pool remains 10. The disposable load generator uses 50 actual source IPs; rate limits and Caddy's forwarding-header replacement remain enabled. Do not run scanners or database tests concurrently with this measurement.
5. `make verify-recovery` dumps with `pg_dump -Fc`, encrypts the synthetic backup, restores into a **new**, uniquely named `slice7_restore_*` database, compares table fingerprints, tests restored audit immutability, and stops/restarts **only** `team13-slice7-db-1` to check generic errors and recovery. It refuses to overwrite an existing restore database. The source is not dropped. This drill is not a production backup service and does not demonstrate a scheduled 24-hour RPO.
6. Refresh disposable sessions after login load: `scripts/verification/compose.sh run --rm create-admin npx tsx scripts/verification/refresh.ts`. Then `make verify-zap` for authenticated passive/spider scans of all roles. Sessions are explicitly provisioned fixtures; automated login discovery is not claimed. Raw reports may include synthetic session values and remain private.
7. Stop the isolated stack with `scripts/verification/compose.sh down`. Keep its volumes and private evidence until review; deletion is a separate operator decision.

The local certificate is issued by the disposable Caddy CA. Python clients verify against the exported local CA; k6 and ZAP use their isolated self-signed test configuration. This is not evidence of public certificate trust. HTTPS is used throughout. Container images for Postgres, Node, Caddy, Semgrep, ZAP and k6 are pinned by digest in the Compose/Dockerfile/scripts. Semgrep registry rules are fetched at execution; preserve scanner version and ruleset evidence with the run.

References: [ZAP authentication headers](https://www.zaproxy.org/docs/getting-further/authentication/handling-auth-yourself/), [k6 source IP assignment](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#local-ips). Neither tool's configuration alone proves test coverage; consult the result summaries and limitations.

## Findings and interpretation

- **F-01, native GET fallback (SR-16 / ASVS V14.2.1):** the first ZAP crawl submitted the login form as `/login?password=ZAP&username=ZAP`. Source inspection confirmed all six forms relied solely on JavaScript `preventDefault` and omitted `method`. Fixed by declaring POST on all six; final rendered-HTML checks and repeat scans validate the change. JavaScript-disabled use remains unsupported, but the fallback must not disclose fields in URLs.
- **F-02, shared-IP load limitation (NFR-3/4):** the initial diagnostic shared one source IP across 50 users and reached the documented 20-logins/15-minute limit. It was stopped early (not an acceptance run). All observed diagnostic failures were 429s. The acceptance baseline assigns 50 real source IPs through k6's `--local-ips`; headers are not spoofed and controls are not weakened. Shared-NAT users can still hit the documented aggregate limit; this is an operational limitation, not a universal claim of 50-user success from one IP.
- **ZAP 10044, large redirect:** review the anonymous root redirect body for sensitive content; a framework-generated redirect body alone is not evidence of disclosure.
- **ZAP 90004, COEP:** low-severity missing cross-origin isolation header. No SharedArrayBuffer/cross-origin-isolated feature is used. Record the finding; no new accepted-risk decision is implied.
- Cache/no-store and modern-web-app informational alerts require interpretation: protected data intentionally uses no-store, and fingerprinted static assets may be cached. Passive spider discovery does not exercise all JavaScript-driven writes.

## Coverage limits

This is local evidence only. No live-host scanning, live migration, or release approval is performed. HTTP probes cover server responses and escaped HTML; they are not a fresh interactive-browser execution of every UI case. Deterministic malformed-body/query cases are bounded fuzz inputs, not an exhaustive fuzz campaign. ZAP role scans use externally provisioned sessions and passive/spider scanning, not a broad active attack scan. Local Semgrep is executed; the CodeQL CLI is unavailable on this host, so fresh CI CodeQL results are identified separately. Backup encryption is a disposable synthetic-data drill (private random key, AES-256-CBC/PBKDF2); production key custody, integrity-protected backup storage, retention and scheduled RPO enforcement remain operational work.

## Additional findings from the executed baseline

- **F-03, transaction conflict recovery (NFR-5/6):** the first full distributed-client run completed 8,212 actions with 60 failed actions (0.7306%, below the configured 1% gate). Six logged login errors had the adapter's structured `TransactionWriteConflict` kind; the helper only retried P2034. A failed re-login invalidated the previous session, so failures propagated into subsequent requests until login succeeded. The fix recognizes both typed conflict forms with the same three-retry limit. Six unit regressions verify recovery, exhaustion and non-retry of unrelated errors. The final run is reported separately from this pre-fix baseline.
- **F-04, scanner findings in test clients:** Semgrep identified four unverified Python TLS contexts. They were replaced with verification against the isolated Caddy issuer exported to `local-ca.crt`. The final static scan must be clean. k6's isolated self-signed test setting and ZAP's local scanner trust are explicitly limited to the verification stack; they do not configure application TLS.
- **ZAP 10202, absence of synchronizer tokens:** reviewed as a false positive for the application's JSON API design. Writes require a matching HTTPS Origin, JSON content type and a hardened SameSite=Strict cookie. The HTTP corpus explicitly rejects foreign/missing/null origins and form-urlencoded content, and database tests cover cross-origin writes. The added native POST fallbacks are not authenticated write endpoints. A form token is not the defense used here (ASVS V3.5.1/V3.5.2).
- **ZAP 10031, controllable attributes:** informational candidates on `categoryId` and `role` form fields; these are React-rendered controls with server-side UUID/enum validation. Source review and escaped stored-script probes found no executable injection. This is scoped review, not a proof against all XSS.

## Executed results — 2026-11-25

Application source: `f53b465e1438be8e0381f8ea2904dbe3121c8f17` (baseline main `17158b2`, plus this MR's native POST and transaction-retry fixes). Runtime image: `sha256:e2258106c0c77f569cee01244508eea9f072fdf8f3c97d575d5d19fb5866ea44`. Docker Linux on Darwin arm64; Node 24.22.3, PostgreSQL 18.7. App and DB limits were inspected: each 1,000,000,000 NanoCPUs and 1,073,741,824 bytes. Earlier synthetic probe/diagnostic rows were retained; the final restore snapshot contains 5,124 incidents and 4,131 audit entries, not a pristine 1,000-row dataset.

| Check | Result |
|---|---|
| Local lint / TypeScript / unit tests | Pass; 110 tests, including six transaction-retry cases |
| PostgreSQL integration tests | 131 passing tests on the isolated test database |
| HTTP runtime corpus | 151/151 pass, including role matrix, native POST forms, unsafe inputs, CSRF defenses, logout replay, and audit page separation beyond 25 records |
| Final k6 baseline | 7,960 completed actions; 50 VUs after a one-minute ramp, five-minute hold; zero request errors |
| Read latency | p95 12.91 ms; max 310.67 ms |
| Write latency | p95 16.52 ms; max 74.71 ms |
| Login latency | p95 75.20 ms; max 204.89 ms |
| Data integrity after load | Zero load-created incidents missing their audit event; zero orphan comments |
| Encrypted backup / new-database restore | All eight table fingerprints identical; 364,464-byte encrypted backup; 1.02 seconds for dump/encrypt/create/restore/compare |
| Restored audit protection | App role denied UPDATE, DELETE and TRUNCATE |
| Database outage / recovery | Generic HTTP 500 while DB unavailable; authenticated request recovered after restart in 6.41 seconds; under the one-hour RTO |
| Log sentinels | 108 distinct secret sentinels checked; zero matches; zero description matches; unexpected outage logged; zero unhandled login errors in the rebuilt app |
| Attack-surface reconciliation | 19 API route files and 13 pages present in the inventory; protected entry points call server-side guards |
| Production dependency audit | Zero reported vulnerabilities |

The final k6 JSON contains passing thresholds for all three p95 metrics and the error rate. A harness edit while its shell wrapper was still running caused a trailing shell parse error **after** k6 completed and wrote that JSON. This is not reported as a clean wrapper exit. The checked-in wrapper passes `sh -n` and now replaces itself with `exec docker run` to avoid a trailing shell read. No benchmark values were inferred from the wrapper exit code or discarded failures. The first shared-IP and pre-retry summaries are retained for comparison.

Local Semgrep uses version 1.185.0 with `p/typescript`, `p/nextjs`, and `p/owasp-top-ten`; raw findings were triaged and the insecure Python contexts fixed. The final count is in `results.json`. Fresh [CI run 108](https://github.com/ahanys1/sec-sys-dev-final-proj/actions/runs/45663427395) and [SAST run 108](https://github.com/ahanys1/sec-sys-dev-final-proj/actions/runs/45663427675) passed on `f53b465`; CodeQL 2.27.5 executed and uploaded its JavaScript/TypeScript analysis. A successful upload is recorded as execution evidence, not an independently enumerated code-scanning alert inventory.

ZAP 2.17.0 completed public and authenticated User/Reviewer/Admin passive/spider scans. Raw reports stay private. Sanitized alert identifiers/severities are in `results.json`; medium CSRF-token warnings were triaged against the explicit origin/content-type rejection tests, informational attribute candidates against rendering/validation, and low COEP is recorded above. This is not a claim of complete active-scan or browser coverage.
