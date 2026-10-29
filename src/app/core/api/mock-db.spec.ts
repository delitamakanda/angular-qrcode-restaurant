import db from '../../../../mock-api/db.json';

const unique = (values: string[]) => new Set(values).size === values.length;

describe('mock-api/db.json integrity', () => {
  const categoryIds = db.categories.map((c) => c.id);
  const menuIds = db.menus.map((m) => m.id);
  const groupIds = db.groups.map((g) => g.id);

  it('has at least 6 categories with unique ids and consecutive sort orders', () => {
    expect(db.categories.length).toBeGreaterThanOrEqual(6);
    expect(unique(categoryIds)).toBe(true);
    expect(categoryIds.every((id) => id.startsWith('cat-'))).toBe(true);
    const orders = db.categories.map((c) => c.sort_order).sort((a, b) => a - b);
    expect(orders).toEqual(orders.map((_, i) => i + 1));
  });

  it('has at least 15 well-formed menu items', () => {
    expect(db.menus.length).toBeGreaterThanOrEqual(15);
    expect(unique(menuIds)).toBe(true);
    for (const item of db.menus) {
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

  it('gives every menu item its own image, never the placeholder', () => {
    const urls = db.menus.map((m) => m.image_url);
    expect(unique(urls)).toBe(true);
    expect(urls).not.toContain('/images/placeholder-food.svg');
  });

  it('has at least 2 items per category, a sold-out item and a non-deliverable item', () => {
    for (const id of categoryIds) {
      expect(db.menus.filter((m) => m.category_id === id).length).toBeGreaterThanOrEqual(2);
    }
    expect(db.menus.some((m) => m.is_sold_out && m.tags.includes('sold-out'))).toBe(true);
    expect(db.menus.some((m) => !m.mode_availability.delivery)).toBe(true);
  });

  it('has valid, unique groups and options', () => {
    expect(unique(groupIds)).toBe(true);
    expect(unique(db.options.map((o) => o.id))).toBe(true);
    for (const group of db.groups) expect(menuIds).toContain(group.menu_item_id);
    for (const option of db.options) expect(groupIds).toContain(option.group_id);
    const itemsWithGroups = new Set(db.groups.map((g) => g.menu_item_id));
    expect(itemsWithGroups.size).toBeGreaterThanOrEqual(4);
  });
});
