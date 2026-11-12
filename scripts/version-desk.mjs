import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const assets = ['style.css', 'app.js', 'search.js', 'topics.js'];
const hash = createHash('sha256');
for (const asset of assets) hash.update(await readFile(new URL(asset, dist)));
const version = hash.digest('hex').slice(0, 12);

// Keep a single release's CSS, search code and topic index together on Pages.
for (const file of ['index.html', 'app.js', 'search.js']) {
  const url = new URL(file, dist);
  let content = await readFile(url, 'utf8');
  for (const asset of assets) content = content.replaceAll(`./${asset}`, `./${asset}?v=${version}`);
  await writeFile(url, content);
}
