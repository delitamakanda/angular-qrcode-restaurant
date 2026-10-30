export type Row = Record<string, unknown> & { id: string };

export interface OrderRepository {
  list(): Promise<Row[]>;
  get(id: string): Promise<Row | undefined>;
  /** `build` receives a unique, increasing sequence number (1 = first persisted order). */
  create(build: (sequence: number) => Row): Promise<Row>;
}

// Minimal structural subset of the Cloudflare D1 binding used here.
export interface D1Like {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      first<T>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
    all<T>(): Promise<{ results: T[] }>;
  };
}

// Minimal structural subset of a Durable Object namespace (the OrderRoom worker).
export interface DurableObjectNamespaceLike {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}

export interface Env {
  ORDERS_DB?: D1Like;
  ORDER_ROOM?: DurableObjectNamespaceLike;
  /** Shared secret enabling `POST /api/orders/:id/status` (disabled when unset). */
  ORDER_STATUS_TOKEN?: string;
}

export const createMemoryOrderRepository = (seed: Row[] = []): OrderRepository => {
  const orders = structuredClone(seed);
  return {
    list: async () => [...orders],
    get: async (id) => orders.find((order) => order.id === id),
    create: async (build) => {
      const order = build(orders.length + 1);
      orders.push(order);
      return order;
    },
  };
};

// The sequence comes from a single atomic `UPDATE ... RETURNING`, so concurrent
// creations never share an order number. Schema: functions/migrations/0001_orders.sql.
export const createD1OrderRepository = (db: D1Like, seed: Row[] = []): OrderRepository => ({
  list: async () => {
    const { results } = await db
      .prepare('SELECT data FROM orders ORDER BY seq')
      .all<{ data: string }>();
    return [...seed, ...results.map((row) => JSON.parse(row.data) as Row)];
  },
  get: async (id) => {
    const seeded = seed.find((order) => order.id === id);
    if (seeded) {
      return seeded;
    }
    const row = await db
      .prepare('SELECT data FROM orders WHERE id = ?')
      .bind(id)
      .first<{ data: string }>();
    return row ? (JSON.parse(row.data) as Row) : undefined;
  },
  create: async (build) => {
    const counter = await db
      .prepare("UPDATE counters SET value = value + 1 WHERE name = 'orders' RETURNING value")
      .bind()
      .first<{ value: number }>();
    if (!counter) {
      throw new Error('orders counter is missing: apply functions/migrations');
    }
    const order = build(seed.length + counter.value);
    await db
      .prepare('INSERT INTO orders (id, data) VALUES (?, ?)')
      .bind(order.id, JSON.stringify(order))
      .run();
    return order;
  },
});
