import fs from 'fs';

const dbPath = 'mock-api/db.json';

const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

const imagesPath = '/images/bubble-house';

// banner image for bubble house
db.stores = db.stores.map((store) => ({
  ...store,
  cover_image_url: `${imagesPath}/bubble-house-cover.webp`,
}));

// products images for bubble house
db.menus = db.menus.map((product) => ({
  ...product,
  image_url: `${imagesPath}/products/item-${product.id}.webp`,
}));

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log(`${db.stores.length} stores and ${db.menus.length} products updated with images.`);
