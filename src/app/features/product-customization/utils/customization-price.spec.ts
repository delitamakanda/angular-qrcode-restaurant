import { ModifierGroup } from '@app/core/models/modifier.model';
import {
  clampQuantity,
  maxSelect,
  minSelect,
  missingGroups,
  toggleOption,
  toSelectedOptions,
  totalPrice,
  unitPrice,
} from './customization-price';

const option = (id: string, price_delta = 0, is_available = true) => ({
  id,
  group_id: 'g',
  name: id.toUpperCase(),
  price_delta,
  is_available,
});

const single: ModifierGroup = {
  id: 'size',
  name: 'Size',
  required: true,
  min_select: 1,
  max_select: 1,
  options: [option('m'), option('l', 10), option('xl', 20, false)],
};

const multi: ModifierGroup = {
  id: 'top',
  name: 'Toppings',
  required: false,
  min_select: 1,
  max_select: 2,
  options: [option('a', 5), option('b', 5), option('c', 5)],
};

describe('customization-price', () => {
  it('ignores min_select for optional groups', () => {
    expect(minSelect(multi)).toBe(0);
    expect(minSelect(single)).toBe(1);
    expect(minSelect({ ...single, min_select: undefined })).toBe(1);
  });

  it('defaults max_select to the number of options', () => {
    expect(maxSelect({ ...multi, max_select: undefined })).toBe(3);
  });

  it('lists the groups below their minimum', () => {
    expect(missingGroups([single, multi], {})).toEqual([single]);
    expect(missingGroups([single, multi], { size: ['m'] })).toEqual([]);
  });

  it('replaces the value of a single-choice group', () => {
    expect(toggleOption(single, ['m'], 'l')).toEqual(['l']);
  });

  it('never exceeds max_select and allows unchecking', () => {
    expect(toggleOption(multi, ['a', 'b'], 'c')).toEqual(['a', 'b']);
    expect(toggleOption(multi, ['a', 'b'], 'a')).toEqual(['b']);
    expect(toggleOption(multi, ['a'], 'b')).toEqual(['a', 'b']);
  });

  it('maps selections to cart options, skipping unavailable ones', () => {
    expect(toSelectedOptions([single, multi], { size: ['xl'], top: ['a'] })).toEqual([
      { group_id: 'top', option_id: 'a', label: 'A', price_delta: 5 },
    ]);
  });

  it('computes (base + deltas) × quantity', () => {
    const options = toSelectedOptions([single, multi], { size: ['l'], top: ['a', 'b'] });

    expect(unitPrice(55, options)).toBe(75);
    expect(totalPrice(55, options, 3)).toBe(225);
  });

  it('clamps the quantity between 1 and 20', () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(21)).toBe(20);
    expect(clampQuantity(4)).toBe(4);
  });
});
