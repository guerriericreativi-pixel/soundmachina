/** Assemble the public PHP landing and a non-public copy of the editor. */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const destination = process.argv[2] && resolve(process.argv[2]);
if (!destination || destination === root || root.startsWith(destination + '/')) throw Error('Provide a separate output directory.');
const editor = readFileSync(resolve(root, 'index.html'), 'utf8');
if (!editor.includes('virus-hardware-panel.js')) throw Error('The editor is incomplete.');
mkdirSync(resolve(destination, '.editor'), { recursive: true });
mkdirSync(resolve(destination, '.access'), { recursive: true });
writeFileSync(resolve(destination, '.editor/index.html'), editor);
for (const folder of ['.editor', '.access']) writeFileSync(resolve(destination, folder, '.htaccess'), 'Require all denied\n');
// The legacy URL is redirected through the PHP gate by .htaccess.
// Do not leave an independently readable static copy of the editor behind.
if (existsSync(resolve(destination, 'index.html'))) rmSync(resolve(destination, 'index.html'));
for (const file of ['index.php','app.php','access.php','landing.php','landing.css','landing.js','.htaccess']) cpSync(resolve(root, 'web-entry', file), resolve(destination, file));
for (const file of ['virus-icons.js','multi-setup.js','multi-setup.css','virus-hardware-panel.js','virus-hardware-panel.css','virus-accessory-panel.css','virus-panel-layouts.js']) cpSync(resolve(root,file),resolve(destination,file));
cpSync(resolve(root,'assets'),resolve(destination,'assets'),{recursive:true,filter:path=>!path.endsWith('.DS_Store')});
console.log('Invite-gated entry assembled: '+destination);
