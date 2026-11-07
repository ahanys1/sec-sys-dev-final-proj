# ASVS Checklist

Security requirements for this project: the assignment's own requirements plus OWASP ASVS 5.0.0 Level 2 (which includes Level 1).

- `assignment-mapping.md`: assignment SR/FR/NFR requirements mapped to ASVS IDs. **Mandatory; takes precedence over ASVS.**
- `owasp-top10-mapping.md`: OWASP Top 10:2025 crosswalk to ASVS chapters (team-authored, not an official mapping).
- `V01-*.md` to `V16-*.md`: one file per ASVS chapter, L1 and L2 requirements only (246 total). V17 (WebRTC) is omitted as inapplicable; L3 is out of scope.

## Status
`TODO` | `Done` | `N/A: <reason>`. Never mark `Done` without evidence (file path or test name) in the Evidence column. Update status in the same commit as the change. V9 (tokens) and V10 (OAuth/OIDC) are `N/A` if the design doesn't use them.

## Source
[OWASP ASVS v5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0), requirement text from `5.0/docs_en/*_en.csv`, verbatim. Licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); these derived files are shared under the same license.
