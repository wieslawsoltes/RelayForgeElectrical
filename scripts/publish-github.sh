#!/usr/bin/env bash
# Publish the complete extracted source with the caller's GitHub CLI authentication.
# No force pushes, saved credentials, npm publication, or unrelated repositories.
set -euo pipefail
repo='wieslawsoltes/RelayForgeElectrical'
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
for command in git gh node python3; do
  command -v "$command" >/dev/null || { echo "$command is required" >&2; exit 1; }
done
[[ -f "$root/packages/core/index.js" && -f "$root/app/main.js" ]] || {
  echo 'Extract the complete RelayForge source ZIP before running this script.' >&2; exit 1;
}
gh auth status >/dev/null
(cd "$root" && npm test && npm run build:pages && npm run build && npm run validate)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
gh repo clone "$repo" "$work/repository" -- --branch main
python3 - "$root" "$work/repository" <<'PY'
from pathlib import Path
import shutil, sys
source, target = map(Path, sys.argv[1:])
excluded = {'.git', 'node_modules', '.data', 'dist', 'dist-pages', 'artifacts', 'test-results', '__pycache__', '.recovery'}
for file in source.rglob('*'):
    relative = file.relative_to(source)
    if not file.is_file() or file.is_symlink() or any(part in excluded for part in relative.parts):
        continue
    if file.name.startswith('.env') or str(relative) == 'worker/index.js':
        continue
    destination = target / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(file, destination)
PY
cd "$work/repository"
if ! git config user.name >/dev/null; then git config user.name "$(gh api user --jq .login)"; fi
if ! git config user.email >/dev/null; then git config user.email "$(gh api user --jq .login)@users.noreply.github.com"; fi
git add .
git diff --cached --quiet || git commit -m 'feat: publish complete RelayForge source and browser-local Pages app'
git push origin HEAD:main
# Initial Pages activation needs an administrator's authorized CLI token.
if gh api "repos/$repo/pages" >/dev/null 2>&1; then
  gh api --method PUT "repos/$repo/pages" -f build_type=workflow >/dev/null
else
  gh api --method POST "repos/$repo/pages" -f build_type=workflow >/dev/null
fi
if ! gh workflow run pages.yml --repo "$repo" --ref main; then
  echo 'The push has been sent. Check Actions; the workflow may still be registering.' >&2
fi
printf '\nSource pushed: https://github.com/%s\n' "$repo"
printf 'Deployment status: https://github.com/%s/actions/workflows/pages.yml\n' "$repo"
printf 'Expected site after a successful deployment: https://wieslawsoltes.github.io/RelayForgeElectrical/\n'
