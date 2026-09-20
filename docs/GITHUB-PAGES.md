# GitHub Pages deployment

The static demo is built from the same plain JavaScript editor and seven standalone packages as the server-backed application. It uses no remote API, account service, CDN dependency or hosted project database.

## Build and preview

```sh
npm run build:pages
python -m http.server 8080 --directory dist-pages
```

Open http://localhost:8080. The export uses relative asset/module URLs, so a project Pages path such as `/RelayForgeElectrical/` works without a hard-coded owner name. Direct `/app/` bookmarks also work.

## Persistence and collaboration boundary

Projects, comments and the latest 100 revisions are stored in IndexedDB, scoped to this application path. Clearing browser site data deletes these projects. Export project JSON for portable backups. Browser storage quotas and private-browsing lifetime policies apply.

Saved operations retain revision preconditions, receipts, deleted-identity tombstones and explicit conflict review. BroadcastChannel notifies other tabs on the same origin/application path. This is **same-browser synchronization, not remote multi-user collaboration**. Invitation creation is unavailable in the static demo. The included Node/SQLite and Worker servers continue to provide the server-backed workflows.

The UI labels saves as **Saved in this browser** and explains the boundary in the collaboration/account dialogs. A failed IndexedDB write is not reported as a successful save; the existing recovery draft and operation outbox remain available.

## Publish

The `GitHub Pages` workflow tests and builds `dist-pages`, uploads a Pages artifact and deploys it. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**. Initial Pages enablement requires repository administration access; the workflow's short-lived token intentionally has only the deployment permissions it needs. Subsequent pushes to `main` publish new builds.

Official references:
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site

## Verification

`npm test` includes eight browser-storage operation tests in addition to the original 48 tests. `npm run verify:source` checks JavaScript syntax and relative imports. CI additionally installs Playwright Chromium and runs `python scripts/test-pages-browser.py` against the project subpath, testing persistence/reload, same-browser tabs, context isolation, history, export, direct bookmarks, component embedding and mobile layout. Screenshots and the JSON report are workflow artifacts.

During preparation on September 20, 2026, all 56 Node tests, both builds, Worker validation and seven package archives passed under Node 22.16.0. CI targets the documented Node 24 runtime. Local Chromium navigation was blocked by an administrator URL policy before the app loaded; that block was not bypassed and no local browser/physical-GPU qualification is claimed. Use the actual CI run result and artifacts for browser evidence.

## Verified CI evidence

[GitHub Actions run 35543366457](https://github.com/wieslawsoltes/RelayForgeElectrical/actions/runs/35543366457) passed all 56 Node tests, both builds, module verification, Worker validation and seven standalone package builds. Its Chromium 143.0.7499.4 run passed all 12 browser checks with no uncaught JavaScript errors, no failed asset requests and no backend API requests. Download the `browser-evidence` artifact for desktop/mobile screenshots and `browser-report.json`. This is headless Chromium/Canvas fallback evidence, not physical-WebGPU or all-browser qualification.

The deployment job also verifies the public build-info source commit and essential editor, storage and renderer assets over HTTPS. Generated site output and package archives are retained as workflow artifacts.
