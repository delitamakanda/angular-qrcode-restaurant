import assert from 'node:assert/strict';
import { test } from 'node:test';
import { graphql } from './graphql.mjs';

const internalError = {
  errors: [{ message: 'Something went wrong while executing your query on 2026-11-13.' }],
};

test('retries a transient GraphQL error with the same mutation', async (t) => {
  const responses = [internalError, { data: { updated: true } }];
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(responses.shift()));

  assert.deepEqual(await graphql('test', 'mutation { update }', { id: '1' }), { updated: true });
  assert.equal(fetch.mock.callCount(), 2);
  assert.deepEqual(fetch.mock.calls[0].arguments, fetch.mock.calls[1].arguments);
});

test('retries HTTP server errors even when the response is not JSON', async (t) => {
  const responses = [new Response('unavailable', { status: 503 }), Response.json({ data: 42 })];
  const fetch = t.mock.method(globalThis, 'fetch', async () => responses.shift());

  assert.equal(await graphql('test', 'query { value }', {}), 42);
  assert.equal(fetch.mock.callCount(), 2);
});

test('stops after three transient failures', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(internalError));

  await assert.rejects(graphql('test', 'query { value }', {}), /Something went wrong/);
  assert.equal(fetch.mock.callCount(), 3);
});

test('does not retry permanent or mixed GraphQL errors', async (t) => {
  const errors = [...internalError.errors, { message: 'Resource not accessible' }];
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ errors }));

  await assert.rejects(graphql('test', 'query { value }', {}), /Resource not accessible/);
  assert.equal(fetch.mock.callCount(), 1);
});

test('does not retry authentication failures', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    Response.json(internalError, { status: 401 }),
  );

  await assert.rejects(graphql('test', 'query { value }', {}), /GraphQL → 401/);
  assert.equal(fetch.mock.callCount(), 1);
});
