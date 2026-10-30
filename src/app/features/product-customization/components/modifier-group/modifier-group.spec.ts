import { TestBed } from '@angular/core/testing';
import { ModifierGroup as ModifierGroupModel } from '@app/core/models/modifier.model';
import { ModifierGroup } from './modifier-group';

const option = (id: string, is_available = true, price_delta = 0) => ({
  id,
  group_id: 'g',
  name: id,
  price_delta,
  is_available,
});

function render(group: Partial<ModifierGroupModel>, selected: string[] = []) {
  const fixture = TestBed.createComponent(ModifierGroup);
  fixture.componentRef.setInput('group', {
    id: 'g',
    name: 'Group',
    required: true,
    max_select: 1,
    options: [option('a', true, 5), option('b', false)],
    ...group,
  });
  fixture.componentRef.setInput('selected', selected);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('ModifierGroup', () => {
  it('renders a fieldset with legend, badge and radios for a single choice', () => {
    const { el } = render({});

    expect(el.querySelector('fieldset legend')?.textContent).toContain('Group');
    expect(el.querySelector('legend')?.textContent).toContain('Required');
    expect(el.querySelectorAll('input[type="radio"]').length).toBe(2);
  });

  it('renders checkboxes and the Optional badge for multiple choice', () => {
    const { el } = render({ required: false, max_select: 2 });

    expect(el.querySelectorAll('input[type="checkbox"]').length).toBe(2);
    expect(el.querySelector('legend')?.textContent).toContain('Optional');
  });

  it('disables unavailable options and shows the supplement', () => {
    const { el } = render({});
    const inputs = el.querySelectorAll('input');

    expect(inputs[0].disabled).toBe(false);
    expect(inputs[1].disabled).toBe(true);
    expect(el.textContent).toContain('+$5.00');
  });

  it('disables unchecked options once max_select is reached', () => {
    const { el } = render(
      { required: false, max_select: 1 + 1, options: [option('a'), option('b'), option('c')] },
      ['a', 'b'],
    );
    const inputs = el.querySelectorAll('input');

    expect(inputs[2].disabled).toBe(true);
    expect(inputs[0].disabled).toBe(false);
  });

  it('emits the toggled option id', () => {
    const { fixture, el } = render({});
    const emitted: string[] = [];
    fixture.componentInstance.optionToggled.subscribe((id) => emitted.push(id));

    el.querySelector<HTMLInputElement>('input')?.click();

    expect(emitted).toEqual(['a']);
  });

  it('offers a clear action for an optional single-choice group', () => {
    const { fixture, el } = render({ required: false }, ['a']);
    let cleared = 0;
    fixture.componentInstance.cleared.subscribe(() => cleared++);

    el.querySelector<HTMLButtonElement>('.modifier-group__clear')?.click();

    expect(cleared).toBe(1);
  });

  it('marks the checked option as selected', () => {
    const { el } = render({}, ['a']);
    const options = el.querySelectorAll('.modifier-group__option');

    expect(options[0].classList).toContain('modifier-group__option--selected');
    expect(options[1].classList).not.toContain('modifier-group__option--selected');
  });

  it('sets aria-invalid on the fieldset when invalid', () => {
    const { fixture, el } = render({});
    expect(el.querySelector('fieldset')?.hasAttribute('aria-invalid')).toBe(false);

    fixture.componentRef.setInput('invalid', true);
    fixture.detectChanges();

    expect(el.querySelector('fieldset')?.getAttribute('aria-invalid')).toBe('true');
  });
});
