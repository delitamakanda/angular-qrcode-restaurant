// Écrit la version de l'application (tag git) dans src/environments/version.ts.
// Usage : npm run version:git (lancé aussi par le hook postinstall)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'src/environments/version.ts');

/** Version : sortie de `git describe` si disponible, sinon version de package.json. */
export function resolveVersion({ describe, pkgVersion }) {
  const trimmed = describe?.trim();
  return trimmed ? trimmed : pkgVersion;
}

/** Contenu du fichier TypeScript généré (la valeur est échappée via JSON.stringify). */
export function formatVersionFile(version) {
  const escaped = JSON.stringify(version).slice(1, -1).replaceAll("'", String.raw`\'`);
  return `// Fichier généré par scripts/git-version.mjs — ne pas modifier.\nexport const APP_VERSION: string = '${escaped}';\n`;
}

function main() {
  const pkgVersion = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
  let describe;
  try {
    describe = execFileSync('git', ['describe', '--tags', '--always'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (error) {
    console.warn(
      `git-version : git indisponible (${error.message.split('\n')[0]}), repli sur package.json (${pkgVersion}).`,
    );
  }

  const content = formatVersionFile(resolveVersion({ describe, pkgVersion }));
  if (existsSync(target) && readFileSync(target, 'utf8') === content) return;
  writeFileSync(target, content);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.warn(`git-version : échec (${error.message}), le fichier n'a pas été généré.`);
  }
}
