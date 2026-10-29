import db from '../../../../mock-api/db.json';
import { handleRequest } from '../../../../functions/api/_handler';

const get = async (path: string) => {
  const response = await handleRequest(new Request(`https://example.test/api${path}`));
  return { status: response.status, body: (await response.json()) as unknown };
};

describe('Cloudflare Function parity with db.json', () => {
  it('GET /stores/:id returns the store, 404 when unknown', async () => {
    const store = db.stores[0];
    expect(await get(`/stores/${store.id}`)).toEqual({ status: 200, body: store });
    expect((await get('/stores/unknown')).status).toBe(404);
  });

  it('GET /categories filters by store_id and sorts by sort_order', async () => {
    const expected = db.categories
      .filter((c) => c.store_id === 'demo')
      .sort((a, b) => a.sort_order - b.sort_order);
    expect(await get('/categories?store_id=demo&_sort=sort_order')).toEqual({
      status: 200,
      body: expected,
    });
    expect((await get('/categories?store_id=unknown')).body).toEqual([]);
  });

  it('GET /categories/:id returns the category, 404 when unknown', async () => {
    const category = db.categories[0];
    expect(await get(`/categories/${category.id}`)).toEqual({ status: 200, body: category });
    expect((await get('/categories/unknown')).status).toBe(404);
  });

  it('GET /menus filters by store_id and category_id', async () => {
    const all = db.menus.filter((m) => m.store_id === 'demo');
    expect((await get('/menus?store_id=demo')).body).toEqual(all);
    const categoryId = db.categories[0].id;
    expect((await get(`/menus?store_id=demo&category_id=${categoryId}`)).body).toEqual(
      all.filter((m) => m.category_id === categoryId),
    );
  });

  it('GET /menus/:id returns the item, 404 when unknown', async () => {
    const item = db.menus[0];
    expect(await get(`/menus/${item.id}`)).toEqual({ status: 200, body: item });
    expect((await get('/menus/unknown')).status).toBe(404);
  });

  it('GET /groups filters by menu_item_id and /groups/:id works', async () => {
    const group = db.groups[0];
    expect((await get(`/groups?menu_item_id=${group.menu_item_id}`)).body).toEqual(
      db.groups.filter((g) => g.menu_item_id === group.menu_item_id),
    );
    expect(await get(`/groups/${group.id}`)).toEqual({ status: 200, body: group });
    expect((await get('/groups/unknown')).status).toBe(404);
  });

  it('GET /options filters by group_id and /options/:id works', async () => {
    const option = db.options[0];
    expect((await get(`/options?group_id=${option.group_id}`)).body).toEqual(
      db.options.filter((o) => o.group_id === option.group_id),
    );
    expect(await get(`/options/${option.id}`)).toEqual({ status: 200, body: option });
    expect((await get('/options/unknown')).status).toBe(404);
  });

  it('GET /promotions serves the collection', async () => {
    expect(await get('/promotions')).toEqual({ status: 200, body: db.promotions });
  });

  it('GET /stores serves the collection and unknown resources are 404', async () => {
    expect((await get('/stores')).body).toEqual(db.stores);
    expect((await get('/unknown')).status).toBe(404);
    expect((await get('/constructor')).status).toBe(404);
  });

  it('POST /orders creates an order retrievable by id, with totals', async () => {
    const response = await handleRequest(
      new Request('https://example.test/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items: [{ total_price: 10 }, { total_price: 5 }] }),
      }),
    );
    expect(response.status).toBe(201);
    const order = (await response.json()) as { id: string; order_number: string; total: number };
    expect(order.total).toBe(15);
    expect(order.order_number).toMatch(/^A\d{3}$/);
    expect((await get(`/orders/${order.id}`)).body).toEqual(order);
    expect((await get('/orders/unknown')).status).toBe(404);
  });

  it('POST /orders keeps the fields sent by the client and returns them on GET', async () => {
    const payload = {
      store_id: 'demo',
      mode: 'take_away',
      payment_mode: 'cash',
      items: [{ total_price: 10 }, { total_price: 5 }],
      order_number: 'A042',
      status: 'pending',
      subtotal: 15,
      discount: 2,
      fees: 1,
      total: 14,
      created_at: '2026-05-01T10:00:00.000Z',
    };
    const response = await handleRequest(
      new Request('https://example.test/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    );
    expect(response.status).toBe(201);
    const order = (await response.json()) as { id: string };
    expect(order).toEqual({ ...payload, id: order.id });
    expect((await get(`/orders/${order.id}`)).body).toEqual(order);
  });
});
