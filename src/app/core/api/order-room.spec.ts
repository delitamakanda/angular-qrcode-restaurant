import {
  OrderRoom,
  type RoomOrder,
  type RoomSocket,
  type RoomState,
} from '../../../../workers/order-room/src/order-room';

const makeSocket = () => ({ send: vi.fn<(m: string) => void>(), close: vi.fn() });

describe('OrderRoom Durable Object', () => {
  let stored: Record<string, unknown>;
  let accepted: ReturnType<typeof makeSocket>[];
  let room: OrderRoom;

  const state: RoomState = {
    storage: {
      get: <T>(key: string) => Promise.resolve(stored[key] as T | undefined),
      put: (key, value) => {
        stored[key] = value;
        return Promise.resolve();
      },
    },
    acceptWebSocket: (socket: RoomSocket) => {
      accepted.push(socket as ReturnType<typeof makeSocket>);
    },
    getWebSockets: () => accepted,
  };

  const order = (status: string): RoomOrder => ({ id: 'o1', status });
  const post = (path: string, body: unknown) =>
    room.fetch(new Request(`https://room${path}`, { method: 'POST', body: JSON.stringify(body) }));
  const upgrade = () =>
    room.fetch(new Request('https://room/ws', { headers: { Upgrade: 'websocket' } }));

  beforeEach(() => {
    stored = {};
    accepted = [];
    room = new OrderRoom(state, undefined, () => ({ client: makeSocket(), server: makeSocket() }));
    // Node's Response rejects status 101 and the `webSocket` init field.
    vi.stubGlobal(
      'Response',
      class {
        status: number;
        constructor(_body?: unknown, init?: { status?: number }) {
          this.status = init?.status ?? 200;
        }
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('answers 426 to a request that is not a WebSocket upgrade', async () => {
    expect((await room.fetch(new Request('https://room/ws'))).status).toBe(426);
  });

  it('accepts an upgrade with 101', async () => {
    expect((await upgrade()).status).toBe(101);
    expect(accepted).toHaveLength(1);
  });

  it('sends the current order as soon as a client connects', async () => {
    await post('/seed', order('preparing'));
    await upgrade();

    expect(accepted[0].send).toHaveBeenCalledWith(JSON.stringify(order('preparing')));
    expect(accepted[0].close).not.toHaveBeenCalled();
  });

  it('does not overwrite an existing order when seeding', async () => {
    await post('/publish', order('ready'));
    await post('/seed', order('pending'));
    await upgrade();

    expect(accepted[0].send).toHaveBeenCalledWith(JSON.stringify(order('ready')));
  });

  it('broadcasts each published order to every connected client', async () => {
    await upgrade();
    await upgrade();
    await post('/publish', order('accepted'));

    for (const socket of accepted) {
      expect(socket.send).toHaveBeenCalledWith(JSON.stringify(order('accepted')));
      expect(socket.close).not.toHaveBeenCalled();
    }
  });

  it.each(['completed', 'cancelled'])(
    'closes every socket on terminal status %s',
    async (status) => {
      await upgrade();
      await upgrade();
      await post('/publish', order(status));

      for (const socket of accepted) {
        expect(socket.send).toHaveBeenCalledWith(JSON.stringify(order(status)));
        expect(socket.close).toHaveBeenCalled();
      }
    },
  );

  it('closes a client connecting after the order is terminal, after sending it', async () => {
    await post('/publish', order('completed'));
    await upgrade();

    expect(accepted[0].send).toHaveBeenCalled();
    expect(accepted[0].close).toHaveBeenCalled();
  });

  it('rejects invalid payloads with 400', async () => {
    const bad = await room.fetch(
      new Request('https://room/publish', { method: 'POST', body: 'nope' }),
    );
    expect(bad.status).toBe(400);
    expect((await post('/publish', { id: 1 })).status).toBe(400);
  });
});
