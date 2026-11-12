import { readdir, readFile, writeFile } from 'node:fs/promises';

const directory = new URL('../dist/oftly/', import.meta.url);
for (const file of await readdir(directory, { recursive: true })) {
  if (!/\.(html|js|css)$/.test(file) || file === 'sw.js') continue;
  const url = new URL(file, directory);
  const content = await readFile(url, 'utf8');
  // Relocate the literal public paths that Vite's relative base cannot resolve.
  const mounted = content.replace(/(["'])\/(?=brand\/|fonts\/|appearance\.js|theme\.css|privacy(?:\.html|\.css)|sw\.js|#today)/g, '$1./');
  if (content !== mounted) await writeFile(url, mounted);
}

const worker = new URL('sw.js', directory);
const content = await readFile(worker, 'utf8');
await writeFile(worker, content
  .replace('const CACHE="oftly-', 'const PREFIX="open-tutor-oftly-"+location.pathname+"-", CACHE=PREFIX+"')
  .replace("startsWith('oftly-')", 'startsWith(PREFIX)')
  .replace(/(FILES=\[[^\n]*?\]);/, '$1.map(file=>new URL(file.slice(1),location.href).pathname);')
  .replace("c.match('/index.html')", "c.match(new URL('index.html',location.href))"));
