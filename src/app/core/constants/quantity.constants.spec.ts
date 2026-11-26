import { MAX_QUANTITY, MIN_QUANTITY, clampQuantity } from './quantity.constants';

describe('clampQuantity', () => {
  it('clamps the quantity between MIN_QUANTITY and MAX_QUANTITY', () => {
    expect(clampQuantity(0)).toBe(MIN_QUANTITY);
    expect(clampQuantity(MAX_QUANTITY + 1)).toBe(MAX_QUANTITY);
    expect(clampQuantity(4)).toBe(4);
  });
});
