# Documented source and packaging

Team #13

Issue #20; NFR-8 (component documentation), NFR-9 (portable setup), SR-14 / ASVS V13.3.1 (exclude secrets). This is a source-candidate procedure. A generated archive is not a verified release or the complete final submission.

## Component guide

| Component | Responsibility / documentation |
|---|---|
| `app/`, `components/` | Next.js pages, forms, shared header/sign-out, and Route Handlers. Current account UI is described in [the manual](user-manual.md). Handler comments identify entry points and requirements. |
| `src/lib/auth/` | Password policy/hashing, session lifetime and cookies, guards, lockout, settings defaults, and initial administrator. Inline comments explain security boundaries. |
| `src/lib/admin/` | Strict account schemas, generated temporary passwords, and audited account/role/status changes; last-administrator protection uses transactions. |
| `src/lib/http.ts`, `request.ts`, `logger.ts` | Generic client errors, request IDs, input limits/origin/schema checks, and scrubbed server diagnostics. |
| `src/lib/audit.ts`, `tx.ts`, `db.ts` | Atomic audit writes, retried serializable transactions, and restricted database access. |
| `prisma/` | Data model and ordered migrations, including database-enforced append-only audit protection and privilege grants. Generated client is recreated by `npm ci`. |
| `src/data/` | Offline password blocklist and its provenance/checksum in `src/data/README.md`; not a user-data seed. |
| `proxy.ts`, `Caddyfile` | Request headers/CSP and HTTPS boundary. Route guards remain authoritative for access control. |
| `Dockerfile`, `docker-compose.yml`, `docker/` | Pinned runtime images, private networks, database initialization and separate migration/operator jobs. |
| `scripts/`, `Makefile` | Setup, initial administrator, database/image checks, CI guards, and committed-source export. `make help` lists tasks. |
| `tests/`, `.github/workflows/` | Unit/database tests and CI/security gates. See [security testing](security-testing.md) for execution evidence rather than treating configuration as a passing result. |
| `docs/`, `ASSIGNMENT.md`, `AI-USAGE-REPORT.md` | Requirements, design, threat model, delivery/SDL trackers, manuals, and assistance provenance. |

This inventory covers the current account-focused snapshot. Review the incident/comment and audit/settings components and their non-obvious security comments when #53 and #54 integrate. Their documentation is not certified by this PR.

## Create a source candidate

Run from a Git checkout with tracked changes committed:

```sh
make package-source
```

Outputs are `out/team-13-source-<full-commit-id>.tar` and its `.tar.sha256` checksum. `out/` is ignored. The archive contains tracked files at `HEAD`, including `package-lock.json`, `.nvmrc`, image digests, migration sources, tests, docs, and setup instructions. It excludes Git history and untracked files. Committed `.gitattributes` excludes environment files (including encrypted `.env`), keys/certificates, logs/dumps/backups and generated output; `.env.example` with placeholders remains included.

Tracked staged or unstaged changes cause a failure so the export cannot silently omit edits to existing files. Untracked files are not included: check `git status --short` and commit intended new sources before packaging. Filename exclusions are defense in depth, not a secret scanner; secrets under other names still require review. Local Git attribute overrides can affect exports, so inspect every resulting archive.

For the same commit and Git version, repeated exports should produce the same SHA-256 digest. The full commit ID in the name identifies source; the checksum detects transfer changes. It does not establish publisher authenticity. Share the expected digest through the approved submission channel.

Inspect and extract into a new disposable directory:

```sh
# Replace COMMIT with the full commit ID printed by: git rev-parse HEAD
openssl dgst -sha256 out/team-13-source-COMMIT.tar
cat out/team-13-source-COMMIT.tar.sha256
# Compare the digest values before extracting.
tar -tf out/team-13-source-COMMIT.tar
mkdir -p /tmp/team-13-source-check
tar -xf out/team-13-source-COMMIT.tar -C /tmp/team-13-source-check
```

Use a new empty extraction directory for each candidate. Follow [the manual](user-manual.md) from the extracted root using Node 24 and Docker. The extracted source can install/build/run without `.git`; the packaging target itself requires the original Git checkout. Dependency and image downloads require internet access; this is a lockfile-based source snapshot, not an offline bundle or a claim of bit-identical compiled images.

## Release inspection checklist

Record the commit, archive digest, operator environment, commands, and actual outcomes with final submission evidence. Do not close #20 until these checks and its dependencies pass.

- [ ] Inspect archive contents for secrets, environment/key files, logs, database dumps, generated output, and personal data. Run the project's secret scanner against the candidate; do not rely only on file extensions.
- [ ] Keep only synthetic application data. No database snapshot, default passwords, or pre-provisioned accounts are included; create demo accounts through the manual.
- [ ] Review submitted source and documents for member names/emails outside the cover page. **Known blocker:** historical `AI-USAGE-REPORT.md` headings contain developer names as required by the repository's logging template. Preserve repository provenance; prepare a separate submission rendering with team-number-only attribution and record that transformation before submission. Review other historical files too. The current raw archive is therefore not certified compliant with the submission identity rule.
- [ ] Reconcile the manual with the final #53/#54 screens and review useful inline documentation for all delivered components (NFR-8).
- [ ] On a clean extraction, run `make install`, `make check`, `make test-db`, and `make check-image`; follow HTTPS setup, migration and account workflows. Record OS/browser results (NFR-9), and complete functional/misuse and performance/recovery evidence (#13, #14).
- [ ] Complete SDL release gates, resolve findings, and finalize AI usage, cover page and report. Include dependency versions from the lockfile/image digests plus the actual Node version used.
- [ ] After review and merge, tag the approved release on `main` and regenerate the source candidate at that tag. Do not submit this branch's intermediate snapshot as the final release.
- [ ] Bundle the final report, documented source candidate, sanitized submission documents, and video or approved substitute. Preserve the instructor's approval if using the live-site substitution; retain the final archive/checksum and evidence privately.

The source exporter deliberately leaves tracked documents intact. It does not rewrite historical AI attribution or assert that release gates passed. This PR prepares the manual and packaging mechanism; final integrated validation, submission identity rendering, tagging, and upload remain release work.
