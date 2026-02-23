const { execSync } = require('node:child_process');
const { readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

function listJsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...listJsFiles(p));
    else if (st.isFile() && p.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = [
  ...listJsFiles(join(__dirname, '../src')),
  ...listJsFiles(join(__dirname, '../scripts'))
];

for (const file of files) {
  execSync(`node --check "${file}"`, { stdio: 'inherit' });
}

console.log(`Syntax check OK (${files.length} files).`);
