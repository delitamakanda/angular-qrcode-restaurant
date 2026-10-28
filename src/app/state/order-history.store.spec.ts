import { TestBed } from '@angular/core/testing';
import { ORDER_HISTORY_LIMIT, OrderHistoryEntry, OrderHistoryStore } from './order-history.store';

const KEY = 'cashier-order-history';

function entry(id: string, created_at = '2026-01-01T10:00:00Z'): OrderHistoryEntry {
  return { id, store_id: 'demo', created_at };
}

describe('OrderHistoryStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function create(): OrderHistoryStore {
    return TestBed.inject(OrderHistoryStore);
  }

  it('starts empty', () => {
    expect(create().entries()).toEqual([]);
  });

  it('adds the newest entry first and removes duplicates', () => {
    const store = create();
    store.add(entry('a'));
    store.add(entry('b'));
    store.add(entry('a'));

    expect(store.entries().map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('keeps only the 50 most recent entries', () => {
    const store = create();
    for (let i = 0; i < ORDER_HISTORY_LIMIT + 5; i++) {
      store.add(entry('o' + String(i)));
    }

    expect(store.entries()).toHaveLength(ORDER_HISTORY_LIMIT);
    expect(store.entries()[0].id).toBe('o' + String(ORDER_HISTORY_LIMIT + 4));
  });

  it('removes one entry and clears all', () => {
    const store = create();
    store.add(entry('a'));
    store.add(entry('b'));

    store.remove('a');
    expect(store.entries().map((e) => e.id)).toEqual(['b']);

    store.clear();
    expect(store.entries()).toEqual([]);
  });

  it('restores entries from localStorage', () => {
    localStorage.setItem(KEY, JSON.stringify([entry('a'), entry('b')]));

    expect(
      create()
        .entries()
        .map((e) => e.id),
    ).toEqual(['a', 'b']);
  });

  it('falls back to an empty list on corrupted JSON', () => {
    localStorage.setItem(KEY, '{not json');

    expect(create().entries()).toEqual([]);
  });

  it('ignores a stored value that is not an array', () => {
    localStorage.setItem(KEY, JSON.stringify({ id: 'a' }));

    expect(create().entries()).toEqual([]);
  });

  it('ignores non-string ids, malformed entries and duplicates', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        entry('a'),
        { id: 1, store_id: 'demo', created_at: 'x' },
        null,
        'b',
        entry('a'),
      ]),
    );

    expect(
      create()
        .entries()
        .map((e) => e.id),
    ).toEqual(['a']);
  });

  it('persists changes to localStorage', () => {
    const store = create();
    store.add(entry('a'));
    TestBed.tick();

    expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')).toEqual([entry('a')]);

    store.clear();
    TestBed.tick();

    expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')).toEqual([]);
  });
});
