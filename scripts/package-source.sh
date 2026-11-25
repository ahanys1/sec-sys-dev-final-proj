#!/bin/sh
# NFR-8/9, SR-14, ASVS V13.3.1: export committed source, never the working directory or Git history.
set -eu
cd "$(git rev-parse --show-toplevel)"
if ! git diff --quiet HEAD --; then
  echo 'Commit tracked changes before packaging; the archive represents HEAD only.' >&2
  exit 1
fi
revision=$(git rev-parse HEAD)
prefix="team-13-source-$revision"
mkdir -p out
# A tar (without compression timestamps) is repeatable for the same commit and Git version.
# export-ignore rules come from the committed .gitattributes, not an uncommitted override.
git archive --format=tar --prefix="$prefix/" --output="out/$prefix.tar" "$revision"
(
  cd out
  openssl dgst -sha256 "$prefix.tar" > "$prefix.tar.sha256"
)
printf '%s\n' "out/$prefix.tar" "out/$prefix.tar.sha256"
