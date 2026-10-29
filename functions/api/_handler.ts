import db from '../../mock-api/db.json';
import {
  createD1OrderRepository,
  createMemoryOrderRepository,
  type Env,
  type OrderRepository,
  type Row,
} from './_order-repository';

type DbOrder = (typeof db.orders)[number];

const MAX_BODY_CHARS = 32 * 1024;
const MAX_ITEMS = 100;

// Fallback when no D1 binding is present (tests, `wrangler pages dev` without config).
const seedOrders = db.orders as unknown as Row[];
const fallbackRepository = createMemoryOrderRepository(seedOrders);

const collections = {
  stores: db.stores,
  categories: db.categories,
  menus: db.menus,
  groups: db.groups,
  options: db.options,
  promotions: db.promotions,
} as unknown as Record<string, Row[]>;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const notFound = () => json({ message: 'Not found' }, 404);
const badRequest = (message: string) => json({ message }, 400);

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

type OrderPayload = Partial<DbOrder> & { items?: Array<{ total_price?: number }> };

const createOrder = async (request: Request, repository: OrderRepository): Promise<Response> => {
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) {
    return badRequest('Payload too large');
  }
  let payload: OrderPayload;
  try {
    payload = JSON.parse(text) as OrderPayload;
  } catch {
    return badRequest('Invalid JSON');
  }
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload) ||
    (payload.items !== undefined &&
      (!Array.isArray(payload.items) || payload.items.length > MAX_ITEMS))
  ) {
    return badRequest('Invalid order payload');
  }
  const subtotal = payload.items?.reduce((sum, item) => sum + (item.total_price ?? 0), 0) ?? 0;
  const now = new Date().toISOString();
  const order = await repository.create((sequence) => ({
    ...(payload as DbOrder),
    id: payload.id ?? `order-${crypto.randomUUID()}`,
    status: payload.status ?? 'pending',
    order_number: payload.order_number ?? `A${String(sequence).padStart(3, '0')}`,
    subtotal: payload.subtotal ?? subtotal,
    discount: payload.discount ?? 0,
    fees: payload.fees ?? 0,
    total: payload.total ?? subtotal,
    created_at: payload.created_at ?? now,
  }));
  return json(order, 201);
};

const resolveRepository = (env: Env | OrderRepository): OrderRepository => {
  if ('create' in env) {
    return env;
  }
  return env.ORDERS_DB ? createD1OrderRepository(env.ORDERS_DB, seedOrders) : fallbackRepository;
};

/** `env` is the Pages Function environment, or directly an `OrderRepository` (tests). */
export const handleRequest = async (
  request: Request,
  env: Env | OrderRepository = {},
): Promise<Response> => {
  const url = new URL(request.url);
  const [resource, id] = parsePath(url);
  const repository = resolveRepository(env);

  if (!resource || (resource !== 'orders' && !Object.hasOwn(collections, resource))) {
    return notFound();
  }

  if (request.method === 'GET') {
    if (resource === 'orders' && id) {
      const order = await repository.get(id);
      return order ? json(order) : notFound();
    }
    const rows = resource === 'orders' ? await repository.list() : collections[resource];
    if (id) {
      const row = rows.find((entry) => entry.id === id);
      return row ? json(row) : notFound();
    }
    return json(filterByQuery(rows, url.searchParams));
  }

  if (request.method === 'POST' && resource === 'orders') {
    return createOrder(request, repository);
  }

  return notFound();
};
