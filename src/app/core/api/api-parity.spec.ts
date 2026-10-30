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

  it('serves every store by id and filters categories and menus per store', async () => {
    expect(db.stores.length).toBeGreaterThanOrEqual(2);
    for (const store of db.stores) {
      expect(await get(`/stores/${store.id}`)).toEqual({ status: 200, body: store });
      const categories = db.categories
        .filter((c) => c.store_id === store.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      expect(await get(`/categories?store_id=${store.id}&_sort=sort_order`)).toEqual({
        status: 200,
        body: categories,
      });
      expect((await get(`/menus?store_id=${store.id}`)).body).toEqual(
        db.menus.filter((m) => m.store_id === store.id),
      );
    }
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

  describe('GET /orders/:id/ws', () => {
    const ws = (headers: Record<string, string> = {}) =>
      new Request('https://example.test/api/orders/order-1001/ws', { headers });

    it('answers 501 without the ORDER_ROOM binding so the client polls', async () => {
      expect((await handleRequest(ws({ Upgrade: 'websocket' }))).status).toBe(501);
    });

    describe('with a Durable Object namespace', () => {
      const fetchRoom = vi.fn<(request: Request) => Promise<Response>>();
      const idFromName = vi.fn((name: string) => `id:${name}`);
      const getRoom = vi.fn((id: unknown) => ({ id, fetch: fetchRoom }));
      const env = { ORDER_ROOM: { idFromName, get: getRoom } };

      beforeEach(() => {
        fetchRoom.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
        idFromName.mockClear();
        getRoom.mockClear();
      });

      it('answers 426 to a request that is not a WebSocket upgrade', async () => {
        expect((await handleRequest(ws(), env)).status).toBe(426);
        expect(fetchRoom).not.toHaveBeenCalled();
      });

      it('answers 404 for an unknown order', async () => {
        const request = new Request('https://example.test/api/orders/unknown/ws', {
          headers: { Upgrade: 'websocket' },
        });
        expect((await handleRequest(request, env)).status).toBe(404);
      });

      it('seeds the room with the order, then forwards the upgrade to the order room', async () => {
        const request = ws({ Upgrade: 'websocket' });
        const response = await handleRequest(request, env);

        expect(response.status).toBe(204);
        expect(idFromName).toHaveBeenCalledWith('order-1001');
        expect(getRoom).toHaveBeenCalledWith('id:order-1001');
        const [seed, upgrade] = fetchRoom.mock.calls.map(([r]) => r);
        expect(new URL(seed.url).pathname).toBe('/seed');
        expect(await seed.json()).toEqual(db.orders[0]);
        expect(upgrade).toBe(request);
      });
    });
  });

  describe('POST /orders/:id/status', () => {
    const fetchRoom = vi.fn<(request: Request) => Promise<Response>>();
    const env = {
      ORDER_STATUS_TOKEN: 's3cret',
      ORDER_ROOM: { idFromName: (name: string) => name, get: () => ({ fetch: fetchRoom }) },
    };
    const post = (body: unknown, token = 's3cret') =>
      new Request('https://example.test/api/orders/order-1001/status', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

    beforeEach(() => fetchRoom.mockReset().mockResolvedValue(new Response(null, { status: 204 })));

    it('is disabled (404) without the room binding and token', async () => {
      expect((await handleRequest(post({ status: 'ready' }))).status).toBe(404);
    });

    it('rejects a wrong token and an invalid status', async () => {
      expect((await handleRequest(post({ status: 'ready' }, 'nope'), env)).status).toBe(401);
      expect((await handleRequest(post({ status: 'burnt' }), env)).status).toBe(400);
      expect(fetchRoom).not.toHaveBeenCalled();
    });

    it('publishes the updated order to the room', async () => {
      const response = await handleRequest(post({ status: 'ready' }), env);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ...db.orders[0], status: 'ready' });
      const [publish] = fetchRoom.mock.calls[0];
      expect(new URL(publish.url).pathname).toBe('/publish');
      expect(await publish.json()).toEqual({ ...db.orders[0], status: 'ready' });
    });
  });
});
