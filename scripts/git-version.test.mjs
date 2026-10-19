import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatVersionFile, resolveVersion } from './git-version.mjs';

test('tag exact', () => {
  assert.equal(resolveVersion({ describe: 'v1.2.0\n', pkgVersion: '0.0.0' }), 'v1.2.0');
});

test('tag + commits', () => {
  assert.equal(
    resolveVersion({ describe: 'v1.2.0-3-gabc1234', pkgVersion: '0.0.0' }),
    'v1.2.0-3-gabc1234',
  );
});

test('hash seul', () => {
  assert.equal(resolveVersion({ describe: 'abc1234', pkgVersion: '0.0.0' }), 'abc1234');
});

test('git en erreur : repli sur package.json', () => {
  assert.equal(resolveVersion({ describe: undefined, pkgVersion: '0.0.0' }), '0.0.0');
  assert.equal(resolveVersion({ describe: '  ', pkgVersion: '0.0.0' }), '0.0.0');
});

test('fichier valeur échappée', () => {
  assert.match(formatVersionFile('v1.2.0'), /export const APP_VERSION = 'v1\.2\.0';\n$/);
  const out = formatVersionFile(`a'b"c\\d`);
  assert.ok(out.includes(String.raw`'a\'b\"c\\d'`));
});
