import db from '../../../../mock-api/db.json';
import { handleRequest } from '../../../../functions/api/_handler';
import {
  createD1OrderRepository,
  createMemoryOrderRepository,
  type D1Like,
  type OrderRepository,
  type Row,
} from '../../../../functions/api/_order-repository';

interface Order {
  id: string;
  order_number: string;
}

const seed = db.orders as unknown as Row[];

const post = (body: string, env: OrderRepository | { ORDERS_DB: D1Like }) =>
  handleRequest(new Request('https://example.test/api/orders', { method: 'POST', body }), env);

const get = (path: string, env: OrderRepository | { ORDERS_DB: D1Like }) =>
  handleRequest(new Request(`https://example.test/api${path}`), env);

// Minimal in-memory D1 double handling the four statements used by the repository.
const createFakeD1 = (): D1Like => {
  const stored: { id: string; data: string }[] = [];
  let counter = 0;
  return {
    prepare: (query) => {
      const statement = (values: unknown[]) => ({
        all: () => Promise.resolve({ results: stored.map((row) => ({ data: row.data })) } as never),
        first: () => {
          if (query.startsWith('UPDATE')) {
            return Promise.resolve({ value: ++counter } as never);
          }
          const row = stored.find((entry) => entry.id === values[0]);
          return Promise.resolve((row ? { data: row.data } : null) as never);
        },
        run: () => {
          stored.push({ id: values[0] as string, data: values[1] as string });
          return Promise.resolve();
        },
      });
      return { bind: (...values) => statement(values), all: statement([]).all };
    },
  };
};

describe('orders persistence', () => {
  it('finds an order again through a later handleRequest sharing the repository', async () => {
    const repository = createMemoryOrderRepository();
    const created = (await (await post('{"items":[]}', repository)).json()) as Order;
    const response = await get(`/orders/${created.id}`, repository);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(created);
  });

  it('lists seed and created orders, with filters and _sort', async () => {
    const repository = createMemoryOrderRepository(seed);
    await post('{"id":"order-b","items":[]}', repository);
    await post('{"id":"order-a","items":[]}', repository);
    const all = (await (await get('/orders', repository)).json()) as Order[];
    expect(all.map((order) => order.id)).toEqual([...seed.map((o) => o.id), 'order-b', 'order-a']);
    const filtered = (await (await get('/orders?id=order-a', repository)).json()) as Order[];
    expect(filtered.map((order) => order.id)).toEqual(['order-a']);
    const sorted = (await (await get('/orders?_sort=id', repository)).json()) as Order[];
    expect(sorted.map((order) => order.id)).toEqual(
      all.map((order) => order.id).sort((a, b) => a.localeCompare(b)),
    );
  });

  it('gives distinct order numbers to parallel creations', async () => {
    const repository = createMemoryOrderRepository();
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => post('{"items":[]}', repository)),
    );
    const orders = await Promise.all(responses.map((r) => r.json() as Promise<Order>));
    expect(new Set(orders.map((order) => order.order_number)).size).toBe(5);
  });

  it.each(['not json', '[]', '{"items":"x"}', JSON.stringify({ items: Array(101).fill({}) })])(
    'rejects invalid payload %s with 400',
    async (body) => {
      expect((await post(body, createMemoryOrderRepository())).status).toBe(400);
    },
  );

  it('rejects a payload over 32 KB with 400', async () => {
    const body = JSON.stringify({ note: 'x'.repeat(33 * 1024) });
    expect((await post(body, createMemoryOrderRepository())).status).toBe(400);
  });

  describe('Cloudflare D1 repository', () => {
    it('persists through the ORDERS_DB binding, merged with the seed', async () => {
      const env = { ORDERS_DB: createFakeD1() };
      const first = (await (await post('{"items":[]}', env)).json()) as Order;
      const second = (await (await post('{"items":[]}', env)).json()) as Order;
      expect(first.order_number).not.toBe(second.order_number);

      expect(await (await get(`/orders/${first.id}`, env)).json()).toEqual(first);
      expect((await get('/orders/unknown', env)).status).toBe(404);
      const all = (await (await get('/orders', env)).json()) as Order[];
      expect(all.map((order) => order.id)).toEqual([...seed.map((o) => o.id), first.id, second.id]);
    });

    it('numbers orders after the seed, like the in-memory repository', async () => {
      const d1 = createFakeD1();
      const fromD1 = await createD1OrderRepository(d1, seed).create((n) => ({ id: 'x', n }));
      const fromMemory = await createMemoryOrderRepository(seed).create((n) => ({ id: 'x', n }));
      expect(fromD1['n']).toBe(fromMemory['n']);
    });
  });
});
