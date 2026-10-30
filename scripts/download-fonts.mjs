import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'scripts/font-download-manifest.json'), 'utf8'));
const digest = data => createHash('sha256').update(data).digest('hex');
for (const { path, sha256 } of manifest.files) {
  if (!/^(?:public\/)?fonts\/[\w./-]+\.(woff2?|ttf|otf)$/i.test(path) || path.includes('..')) throw new Error(`Invalid font path: ${path}`);
  const target = resolve(root, path);
  const existing = await readFile(target).catch(() => null);
  if (existing && digest(existing) === sha256) { console.log(`Present: ${path}`); continue; }
  await mkdir(dirname(target), { recursive: true });
  const temp = `${target}.download`;
  const url = `https://raw.githubusercontent.com/JOYCEQL/magic-resume/${manifest.revision}/${path.split('/').map(encodeURIComponent).join('/')}`;
  console.log(`Downloading: ${path}`);
  try {
    const result = spawnSync('curl', ['--fail', '--location', '--retry', '3', '--silent', '--show-error', '--output', temp, url], { stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`Download failed: ${path}`);
    if (digest(await readFile(temp)) !== sha256) throw new Error(`Checksum mismatch: ${path}`);
    await rename(temp, target);
  } finally { await rm(temp, { force: true }); }
}
console.log('Fonts are ready.');
