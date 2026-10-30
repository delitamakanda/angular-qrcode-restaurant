import db from '../../../../mock-api/db.json';

const unique = (values: string[]) => new Set(values).size === values.length;

describe('mock-api/db.json integrity', () => {
  const categoryIds = db.categories.map((c) => c.id);
  const menuIds = db.menus.map((m) => m.id);
  const groupIds = db.groups.map((g) => g.id);
  const storeIds = db.stores.map((s) => s.id);
  const demoCategories = db.categories.filter((c) => c.store_id === 'demo');
  const demoMenus = db.menus.filter((m) => m.store_id === 'demo');

  it('has at least 2 stores with unique ids, including demo', () => {
    expect(db.stores.length).toBeGreaterThanOrEqual(2);
    expect(unique(storeIds)).toBe(true);
    expect(storeIds).toContain('demo');
  });

  it('has unique category ids prefixed by cat-', () => {
    expect(unique(categoryIds)).toBe(true);
    expect(categoryIds.every((id) => id.startsWith('cat-'))).toBe(true);
  });

  it('has at least 6 demo categories with consecutive sort orders', () => {
    expect(demoCategories.length).toBeGreaterThanOrEqual(6);
    const orders = demoCategories.map((c) => c.sort_order).sort((a, b) => a - b);
    expect(orders).toEqual(orders.map((_, i) => i + 1));
  });

  it('has at least 15 well-formed demo menu items', () => {
    expect(demoMenus.length).toBeGreaterThanOrEqual(15);
    expect(unique(menuIds)).toBe(true);
    for (const item of demoMenus) {
      expect(item.id.startsWith('item-')).toBe(true);
      expect(categoryIds).toContain(item.category_id);
      expect(item.base_price).toBeGreaterThan(0);
      expect(item.image_url).toBe(`/images/bubble-house/products/${item.id}.webp`);
      expect(Object.keys(item.mode_availability).sort()).toEqual([
        'delivery',
        'dine_in',
        'take_away',
      ]);
    }
  });

  it('gives every demo menu item its own image, never the placeholder', () => {
    const urls = demoMenus.map((m) => m.image_url);
    expect(unique(urls)).toBe(true);
    expect(urls).not.toContain('/images/placeholder-food.svg');
  });

  it('has at least 2 items per demo category, a sold-out item and a non-deliverable item', () => {
    for (const { id } of demoCategories) {
      expect(demoMenus.filter((m) => m.category_id === id).length).toBeGreaterThanOrEqual(2);
    }
    expect(demoMenus.some((m) => m.is_sold_out && m.tags.includes('sold-out'))).toBe(true);
    expect(demoMenus.some((m) => !m.mode_availability.delivery)).toBe(true);
  });

  it('has valid, unique groups and options', () => {
    expect(unique(groupIds)).toBe(true);
    expect(unique(db.options.map((o) => o.id))).toBe(true);
    for (const group of db.groups) expect(menuIds).toContain(group.menu_item_id);
    for (const option of db.options) expect(groupIds).toContain(option.group_id);
    const itemsWithGroups = new Set(db.groups.map((g) => g.menu_item_id));
    expect(itemsWithGroups.size).toBeGreaterThanOrEqual(4);
  });

  it('gives every other store its own categories, items, groups and options', () => {
    for (const store of db.stores.filter((s) => s.id !== 'demo')) {
      const categories = db.categories.filter((c) => c.store_id === store.id);
      const menus = db.menus.filter((m) => m.store_id === store.id);
      expect(categories.length).toBeGreaterThanOrEqual(2);
      expect(menus.length).toBeGreaterThanOrEqual(4);
      const orders = categories.map((c) => c.sort_order).sort((a, b) => a - b);
      expect(orders).toEqual(orders.map((_, i) => i + 1));
      for (const item of menus) {
        expect(categories.map((c) => c.id)).toContain(item.category_id);
        expect(Object.keys(item.mode_availability).sort()).toEqual([
          'delivery',
          'dine_in',
          'take_away',
        ]);
      }
      const itemIds = new Set(menus.map((m) => m.id));
      expect(db.groups.some((g) => itemIds.has(g.menu_item_id))).toBe(true);
    }
  });

  it('only references known stores', () => {
    for (const row of [...db.categories, ...db.menus, ...db.promotions]) {
      expect(storeIds).toContain(row.store_id);
    }
  });
});
