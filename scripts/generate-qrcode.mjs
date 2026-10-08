// Génère le QR code du projet en local (bibliothèque `qrcode`, aucun service tiers).
// Usage : npm run qrcode [-- <url>]
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2] ?? 'https://angular-qrcode-restaurant.pages.dev/store/demo/welcome';

const options = { errorCorrectionLevel: 'M', margin: 4 };

await writeFile(
  resolve(root, 'angular-qrcode-restaurant.svg'),
  await QRCode.toString(url, { ...options, type: 'svg' }),
);
await writeFile(
  resolve(root, 'angular-qrcode-restaurant-1024.png'),
  await QRCode.toBuffer(url, { ...options, width: 1024 }),
);

console.log(`QR code généré pour ${url}`);
