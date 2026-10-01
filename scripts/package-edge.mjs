import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (Buffer.byteLength(html) > 1048576) throw new Error('HTML exceeds the existing 1 MiB bucket limit');
const page = 'export const HTML = ' + JSON.stringify(html) + ';\n';
for (const name of ['steve-bingo-beta', 'steve-bingo-publish']) {
  fs.writeFileSync(path.join(root, 'supabase/functions', name, 'page.ts'), page);
}
console.log(JSON.stringify({ htmlBytes: Buffer.byteLength(html), htmlSha256: createHash('sha256').update(html).digest('hex') }));
