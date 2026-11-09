# AGENTS.md

VS Code extension (ImgTree) in a pnpm workspace with two packages:

- `.` (root) — extension host code in `src/`, bundled by esbuild (CJS) to `dist/extension.js`; entry `src/extension.ts`.
- `packages/imgViewer` — Vue 3 + Vite + Element Plus webview app. Its Vite build outputs to the root `dist/webview/` (see `outDir` in `vite.config.ts`), which the extension loads directly as the webview HTML.

## Commands

- `pnpm compile` — full verification loop for extension code: `check-types` → `lint` → esbuild bundle. Run this before considering work done.
- `pnpm watch` — parallel esbuild + tsc watch; this is what F5's preLaunch task uses.
- `pnpm build-vue` — build webview into `dist/webview/`.
- `pnpm dev-vue` — run the vite dev server (port 5173, fixed). Used with the `Run Extension (Webview HMR)` F5 config below; no standalone-browser data flow is mocked (extension postMessage API is absent outside VS Code).
- `pnpm --filter "img-viewer" lint` — lint the Vue package. Root `pnpm lint` only covers `src/`.
- `pnpm format` — prettier on root `src/` only.
- `pnpm vsix` — `build-vue` + `vsce package`. Requires `@vscode/vsce` installed globally (`npm i -g @vscode/vsce`).
- Versioning uses changesets: `pnpm csadd` (create), `pnpm csver` (apply). Base branch is `master`.

## Testing gotcha

`pnpm test` is currently broken: `compile-tests` (`tsc -p . --outDir out`) emits nothing because `tsconfig.json` sets `noEmit: true` (the CLI `--outDir` flag does not override it), so `out/test/**/*.test.js` never exists for `vscode-test` to run. Do not rely on tests for verification; use `pnpm compile` instead.

## Runtime wiring (non-obvious)

- The webview panel loads `dist/webview/index.html` and rewrites `./assets/...` references to webview URIs in `src/commands/imagesExtract/imagesExtract.ts`.
- Extension ↔ webview communicate via postMessage: webview sends `pageReady` / `fetchData` (folder) / `renameFile` (path+name) / `deleteEntries` (paths); host replies `navigate` (to route `/imgViewer`) / `dataRefresh` (tree + resolved folder + current-folder file list + types). All node paths — folders and files alike — are absolute fs paths; `renameFile`/`deleteEntries` rely on this and reject anything outside the watched root. Rename/delete go through `workspace.fs` (`interface/fileOps.ts`; deletes use the OS trash) and rely on the watcher-driven `dataRefresh` to update the UI. All rendering goes through the single `dataRefresh` path; the webview seeds restored state (keywords/type selection/selected file) from its own persisted state on mount — the host does not participate in state restoration.
- The host watches the selected folder (`createFileSystemWatcher` on `**/*`, 1.38-compatible glob overload only) and pushes a debounced, deduped `dataRefresh`; watcher events under `ImgTree.excludeFolders` are filtered out before scheduling a rescan (`interface/ignoreMatch.ts`). It tracks the webview's current folder from `fetchData`. The webview persists only unchecked types (`excludedTypes`) in its state; on each `dataRefresh`, checked = all pushed types − excluded (so unchecked-but-present stays unchecked, new types are auto-checked, vanished types drop out).
- Re-invoking the command on a folder that already has an open panel reveals that panel (`activePanels` map in `imagesExtract.ts`) instead of creating a duplicate panel + watcher.
- Webview multi-select (`checkList`) is pruned to still-existing paths on each `dataRefresh` (items hidden by filters stay checked; folder switches clear it naturally since paths differ) and fully cleared only when keywords/type filters change (`onKeywordsChange` / user-facing `onSelectedTypesChange`, while `dataRefresh` reconciles types through `applySelectedTypes` without clearing). A failed scan (code 500 `dataRefresh`) surfaces as an `ElMessage` toast plus a console error.
- F5 debugging builds only the extension. After changing Vue code you must re-run `pnpm build-vue` for the debug host to pick it up. Alternative: run `pnpm dev-vue` first, then F5 with the `Run Extension (Webview HMR)` config (env `IMG_TREE_DEV_SERVER=http://localhost:5173`) — the webview then loads straight from the vite dev server with full HMR, real host/watcher/fs interaction, and no `build-vue` needed. This requires `server.cors: { origin: '*' }` in `vite.config.ts`: the webview origin is `vscode-webview://<uuid>`, which vite's default CORS (localhost-only) rejects, blocking all module scripts.
- `dist/` is gitignored: a fresh clone needs both `pnpm compile` and `pnpm build-vue` before the extension runs.
- esbuild bundles only `src/extension.ts` with `external: ['vscode']`; `.vscodeignore` ships only `dist/**` in the vsix (`packages/**`, `src/**` are excluded).

## Constraints

- `engines.vscode` is `^1.38.0` with `@types/vscode` 1.38 — only VS Code API ≤ 1.38 is available; bump both together if you need newer APIs.

## Style

- Prettier is enforced through ESLint (`eslint-plugin-prettier`), so `pnpm lint` fails on formatting: no semicolons, single quotes, no trailing commas, `arrowParens: 'avoid'`, 2-space indent.
- Pre-commit hook (simple-git-hooks + lint-staged) auto-runs `prettier --write` and `eslint --fix` on staged files; it is installed by the root `postinstall` during `pnpm install` (`.npmrc` sets `enable-pre-post-scripts = true`).
