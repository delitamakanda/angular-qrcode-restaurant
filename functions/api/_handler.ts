import db from '../../mock-api/db.json';

type DbOrder = (typeof db.orders)[number];
type Row = Record<string, unknown> & { id: string };

const orders: DbOrder[] = structuredClone(db.orders);

const collections = {
  stores: db.stores,
  categories: db.categories,
  menus: db.menus,
  groups: db.groups,
  options: db.options,
  promotions: db.promotions,
  orders,
} as unknown as Record<string, Row[]>;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const notFound = () => json({ message: 'Not found' }, 404);

const parsePath = (url: URL): string[] =>
  url.pathname
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean);

// Mirrors json-server v1: `_`-prefixed keys are reserved, every other key is a field filter.
const RESERVED_QUERY_KEYS = new Set(['_sort', '_page', '_per_page', '_embed', '_where']);

const filterByQuery = (items: Row[], query: URLSearchParams): Row[] => {
  let filtered = [...items];
  query.forEach((value, key) => {
    if (RESERVED_QUERY_KEYS.has(key)) {
      return;
    }
    filtered = filtered.filter((item) => String(item[key]) === value);
  });
  const sortBy = query.get('_sort');
  if (sortBy) {
    filtered.sort((a, b) => {
      const left = a[sortBy];
      const right = b[sortBy];
      if (typeof left === 'number' && typeof right === 'number') {
        return left - right;
      }
      return String(left).localeCompare(String(right));
    });
  }
  return filtered;
};

const createOrder = async (request: Request): Promise<Response> => {
  const payload = (await request.json()) as Partial<DbOrder> & {
    items?: Array<{ total_price?: number }>;
  };
  const subtotal = payload.items?.reduce((sum, item) => sum + (item.total_price ?? 0), 0) ?? 0;
  const now = new Date().toISOString();
  const nextNumber = orders.length + 1;
  const order = {
    ...(payload as DbOrder),
    id: payload.id ?? `order-${crypto.randomUUID()}`,
    status: payload.status ?? 'pending',
    order_number: payload.order_number ?? `A${String(nextNumber).padStart(3, '0')}`,
    subtotal: payload.subtotal ?? subtotal,
    discount: payload.discount ?? 0,
    fees: payload.fees ?? 0,
    total: payload.total ?? subtotal,
    created_at: payload.created_at ?? now,
  };
  orders.push(order as DbOrder);
  return json(order, 201);
};

export const handleRequest = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const [resource, id] = parsePath(url);

  if (!resource || !Object.hasOwn(collections, resource)) {
    return notFound();
  }

  if (request.method === 'GET') {
    const rows = collections[resource];
    if (id) {
      const row = rows.find((entry) => entry.id === id);
      return row ? json(row) : notFound();
    }
    return json(filterByQuery(rows, url.searchParams));
  }

  if (request.method === 'POST' && resource === 'orders') {
    return createOrder(request);
  }

  return notFound();
};
