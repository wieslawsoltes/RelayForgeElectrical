/** Dependency-free static export; all URLs stay beneath the project Pages path. */
import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'dist-pages');
await rm(out, {recursive: true, force: true});
await mkdir(out, {recursive: true});
for (const folder of ['app', 'packages', 'examples']) await cp(path.join(root, folder), path.join(out, folder), {recursive: true});
let index = await readFile(path.join(root, 'app/index.html'), 'utf8');
index = index.replace('<head>', '<head><meta name="relayforge-storage" content="browser">')
  .replace('href="/favicon.svg"', 'href="./app/favicon.svg"')
  .replaceAll('href="/app/', 'href="./app/')
  .replaceAll('src="/app/', 'src="./app/')
  .replace('href="/"', 'href="./"');
await writeFile(path.join(out, 'index.html'), index);
// Direct /app/ bookmarks also load the editor instead of a broken server-only shell.
await writeFile(path.join(out, 'app/index.html'), index.replaceAll('"./app/', '"./').replace('href="./"', 'href="../"'));
let qualification = await readFile(path.join(root, 'examples/qualification.html'), 'utf8');
qualification = qualification.replaceAll('"/examples/', '"./').replace('href="/"', 'href="../"');
await writeFile(path.join(out, 'examples/qualification.html'), qualification);
await writeFile(path.join(out, '.nojekyll'), '');
await writeFile(path.join(out, 'build-info.json'), JSON.stringify({version: '0.2.1', storage: 'browser-local', sourceCommit: process.env.GITHUB_SHA || 'local'}, null, 2));
console.log('Built dist-pages/ (browser-local storage; no backend required)');
