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

const ORDER_STATUSES = new Set([
  'pending',
  'accepted',
  'preparing',
  'ready',
  'cancelled',
  'completed',
]);

const roomFor = (env: Env, orderId: string) =>
  env.ORDER_ROOM?.get(env.ORDER_ROOM.idFromName(orderId));

const sendToRoom = (room: NonNullable<ReturnType<typeof roomFor>>, path: string, order: Row) =>
  room.fetch(
    new Request(`https://order-room${path}`, { method: 'POST', body: JSON.stringify(order) }),
  );

// `GET /orders/:id/ws`: hands the WebSocket upgrade to the order's Durable Object.
// 501 without the ORDER_ROOM binding (the client then polls), 426 for a non-upgrade request.
const connectToRoom = async (
  request: Request,
  env: Env,
  repository: OrderRepository,
  id: string,
): Promise<Response> => {
  const room = roomFor(env, id);
  if (!room) {
    return json({ message: 'WebSocket not available' }, 501);
  }
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return json({ message: 'Expected a WebSocket upgrade' }, 426);
  }
  const order = await repository.get(id);
  if (!order) {
    return notFound();
  }
  await sendToRoom(room, '/seed', order);
  return room.fetch(request);
};

// `POST /orders/:id/status`: demo/back-office hook that pushes a new status to the room.
// Disabled (404) unless both ORDER_ROOM and ORDER_STATUS_TOKEN are configured.
const publishStatus = async (
  request: Request,
  env: Env,
  repository: OrderRepository,
  id: string,
): Promise<Response> => {
  const room = roomFor(env, id);
  if (!room || !env.ORDER_STATUS_TOKEN) {
    return notFound();
  }
  if (request.headers.get('authorization') !== `Bearer ${env.ORDER_STATUS_TOKEN}`) {
    return json({ message: 'Unauthorized' }, 401);
  }
  let status: unknown;
  try {
    status = ((await request.json()) as { status?: unknown } | null)?.status;
  } catch {
    return badRequest('Invalid JSON');
  }
  if (typeof status !== 'string' || !ORDER_STATUSES.has(status)) {
    return badRequest('Invalid status');
  }
  const order = await repository.get(id);
  if (!order) {
    return notFound();
  }
  const updated = { ...order, status };
  await sendToRoom(room, '/publish', updated);
  return json(updated);
};

/** `env` is the Pages Function environment, or directly an `OrderRepository` (tests). */
export const handleRequest = async (
  request: Request,
  env: Env | OrderRepository = {},
): Promise<Response> => {
  const url = new URL(request.url);
  const [resource, id, action] = parsePath(url);
  const repository = resolveRepository(env);

  if (!resource || (resource !== 'orders' && !Object.hasOwn(collections, resource))) {
    return notFound();
  }

  if (resource === 'orders' && id && action) {
    const roomEnv: Env = 'create' in env ? {} : env;
    if (action === 'ws' && request.method === 'GET') {
      return connectToRoom(request, roomEnv, repository, id);
    }
    if (action === 'status' && request.method === 'POST') {
      return publishStatus(request, roomEnv, repository, id);
    }
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
