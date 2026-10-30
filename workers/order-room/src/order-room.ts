// One Durable Object per order (named by `order.id`). It keeps the latest order and
// pushes it to every connected WebSocket. Deployed as its own Worker: a Pages Function
// cannot export a Durable Object class (see workers/order-room/wrangler.toml).

const TERMINAL_STATUSES = new Set(['completed', 'cancelled']);
const STORAGE_KEY = 'order';

export interface RoomOrder {
  id: string;
  status: string;
  [key: string]: unknown;
}

// Minimal structural subsets of the Workers runtime used here (keeps the class testable).
export interface RoomSocket {
  send(message: string): void;
  close(code?: number, reason?: string): void;
}

export interface RoomState {
  storage: {
    get<T>(key: string): Promise<T | undefined>;
    put(key: string, value: unknown): Promise<void>;
  };
  acceptWebSocket(socket: RoomSocket): void;
  getWebSockets(): RoomSocket[];
}

interface SocketPair {
  client: RoomSocket;
  server: RoomSocket;
}

type SocketPairFactory = () => SocketPair;

const defaultSocketPair: SocketPairFactory = () => {
  const { WebSocketPair } = globalThis as unknown as {
    WebSocketPair: new () => { 0: RoomSocket; 1: RoomSocket };
  };
  const pair = new WebSocketPair();
  return { client: pair[0], server: pair[1] };
};

const isRoomOrder = (value: unknown): value is RoomOrder =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as RoomOrder).id === 'string' &&
  typeof (value as RoomOrder).status === 'string';

export class OrderRoom {
  private readonly state: RoomState;
  private readonly createPair: SocketPairFactory;

  constructor(state: RoomState, _env?: unknown, createPair: SocketPairFactory = defaultSocketPair) {
    this.state = state;
    this.createPair = createPair;
  }

  /**
   * - `POST /seed`: stores the order only if the room has none yet.
   * - `POST /publish`: stores the order and broadcasts it to every client.
   * - `Upgrade: websocket` (any other request): accepts the socket and sends the current order.
   * - anything else: 426.
   */
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === 'POST' && (pathname === '/seed' || pathname === '/publish')) {
      let order: unknown;
      try {
        order = await request.json();
      } catch {
        return new Response('Invalid JSON', { status: 400 });
      }
      if (!isRoomOrder(order)) {
        return new Response('Invalid order', { status: 400 });
      }
      if (pathname === '/publish') {
        await this.publish(order);
      } else if ((await this.state.storage.get(STORAGE_KEY)) === undefined) {
        await this.state.storage.put(STORAGE_KEY, order);
      }
      return new Response(null, { status: 204 });
    }

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }
    return this.connect();
  }

  private async connect(): Promise<Response> {
    const { client, server } = this.createPair();
    this.state.acceptWebSocket(server);
    const current = await this.state.storage.get<RoomOrder>(STORAGE_KEY);
    if (current) {
      server.send(JSON.stringify(current));
      if (TERMINAL_STATUSES.has(current.status)) {
        server.close(1000, 'Order closed');
      }
    }
    return new Response(null, { status: 101, webSocket: client } as ResponseInit);
  }

  private async publish(order: RoomOrder): Promise<void> {
    await this.state.storage.put(STORAGE_KEY, order);
    const message = JSON.stringify(order);
    const terminal = TERMINAL_STATUSES.has(order.status);
    for (const socket of this.state.getWebSockets()) {
      socket.send(message);
      if (terminal) socket.close(1000, 'Order closed');
    }
  }
}

export default {
  fetch: (): Response => new Response('Not found', { status: 404 }),
};
