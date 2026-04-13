import db from '../../mock-api/db.json';

type DbOrder = (typeof db.orders)[number];

const orders: DbOrder[] = structuredClone(db.orders);

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const notFound = () => json({ message: 'Not found' }, 404);

const parsePath = (url: URL): string[] =>
  url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);

const filterByQuery = <T extends Record<string, unknown>>(items: T[], query: URLSearchParams): T[] => {
  let filtered = [...items];
  query.forEach((value, key) => {
    if (key === 'sort') {
      return;
    }
    filtered = filtered.filter((item) => String(item[key]) === value);
  });
  const sortBy = query.get('sort');
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
  const payload = (await request.json()) as Partial<DbOrder> & { items?: Array<{ total_price?: number }> };
  const subtotal = payload.items?.reduce((sum, item) => sum + (item.total_price ?? 0), 0) ?? 0;
  const now = new Date().toISOString();
  const nextNumber = orders.length + 1;
  const order: DbOrder = {
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
  orders.push(order);
  return json(order, 201);
};

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const [resource, id] = parsePath(url);

  if (!resource) {
    return notFound();
  }

  if (request.method === 'GET') {
    if (resource === 'stores' && id) {
      const store = db.stores.find((entry) => entry.id === id);
      return store ? json(store) : notFound();
    }

    if (resource === 'menus' && id) {
      const menu = db.menus.find((entry) => entry.id === id);
      return menu ? json(menu) : notFound();
    }

    if (resource === 'orders' && id) {
      const order = orders.find((entry) => entry.id === id);
      return order ? json(order) : notFound();
    }

    if (resource === 'categories') {
      return json(filterByQuery(db.categories, url.searchParams));
    }

    if (resource === 'menus') {
      return json(filterByQuery(db.menus, url.searchParams));
    }

    if (resource === 'groups') {
      return json(filterByQuery(db.groups, url.searchParams));
    }

    if (resource === 'options') {
      return json(filterByQuery(db.options, url.searchParams));
    }
  }

  if (request.method === 'POST' && resource === 'orders') {
    return createOrder(request);
  }

  return notFound();
};
