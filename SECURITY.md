# Security policy (Team #13)

## Scope
- The application on `main` and the `v1.0.0` release.
- The live grading host: https://107-23-118-127.sslip.io

Out of scope: load or denial-of-service testing, social engineering, and AWS resources other than the application host.

## Reporting a vulnerability
Report privately to Team #13 through the course Canvas group, or through the instructor. Do not report in a public issue, pull request, or commit.

Include:
- the page or API route affected,
- the steps to reproduce,
- the impact you observed.

Use synthetic data only (ASSUMP-2). Don't read, change, or keep other accounts' data beyond what proves the issue.

## What happens next
- We acknowledge the report within 2 days while the course is running.
- We rate it with the bug bar in [docs/sdl.md](docs/sdl.md#quality-gates-and-bug-bar-practice-3). Any authentication bypass, privilege escalation, SQL injection, or audit log tampering is High.
- We handle it with the [incident response plan](docs/sdl.md#incident-response-plan-practice-14).
