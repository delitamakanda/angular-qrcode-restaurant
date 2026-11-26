import { CartItem } from '@app/core/models/cart.model';
import { cartLineKey } from './cart-line.util';

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'a',
  menu_item_id: 'm1',
  name: 'Tea',
  quantity: 1,
  unit_base_price: 5,
  total_price: 5,
  ...overrides,
});

const opt = (group_id: string, option_id: string) => ({
  group_id,
  option_id,
  label: option_id,
  price_delta: 0,
});

describe('cartLineKey', () => {
  it('ignores id, quantity and option order', () => {
    const a = item({ selected_options: [opt('g1', 'o1'), opt('g2', 'o2')] });
    const b = item({
      id: 'b',
      quantity: 3,
      selected_options: [opt('g2', 'o2'), opt('g1', 'o1')],
    });
    expect(cartLineKey(a)).toBe(cartLineKey(b));
  });

  it('treats undefined, empty and blank notes as no note', () => {
    const base = cartLineKey(item());
    expect(cartLineKey(item({ note: '' }))).toBe(base);
    expect(cartLineKey(item({ note: '   ' }))).toBe(base);
    expect(cartLineKey(item({ selected_options: [] }))).toBe(base);
  });

  it('trims notes but compares them strictly otherwise', () => {
    expect(cartLineKey(item({ note: ' no ice ' }))).toBe(cartLineKey(item({ note: 'no ice' })));
    expect(cartLineKey(item({ note: 'No ice' }))).not.toBe(cartLineKey(item({ note: 'no ice' })));
  });

  it('differs for another product or other options', () => {
    const base = cartLineKey(item({ selected_options: [opt('g1', 'o1')] }));
    expect(cartLineKey(item({ menu_item_id: 'm2', selected_options: [opt('g1', 'o1')] }))).not.toBe(
      base,
    );
    expect(cartLineKey(item({ selected_options: [opt('g1', 'o2')] }))).not.toBe(base);
  });
});
