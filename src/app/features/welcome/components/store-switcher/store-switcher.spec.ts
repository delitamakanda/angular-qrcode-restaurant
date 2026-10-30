import { TestBed } from '@angular/core/testing';
import { Store } from '@app/core/models/store.model';
import { StoreSwitcher } from './store-switcher';

const store = (id: string, name: string): Store => ({
  id,
  name,
  currency: 'EUR',
  is_open: true,
  supported_modes: ['dine_in'],
});

describe('StoreSwitcher', () => {
  function setup(selectedId: string | null = 'a') {
    const fixture = TestBed.createComponent(StoreSwitcher);
    fixture.componentRef.setInput('stores', [store('a', 'Alpha'), store('b', 'Beta')]);
    fixture.componentRef.setInput('selectedId', selectedId);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const select = el.getElementsByTagName('select')[0];
    const emitted: string[] = [];
    fixture.componentInstance.storeSelected.subscribe((id) => emitted.push(id));
    return { fixture, el, select, emitted };
  }

  it('lists every store as an option, with the current one selected', () => {
    const { select } = setup('b');

    expect(Array.from(select.options).map((o) => o.textContent.trim())).toEqual(['Alpha', 'Beta']);
    expect(select.value).toBe('b');
  });

  it('is labelled for assistive technologies', () => {
    const { el, select } = setup();
    const label = el.getElementsByTagName('label')[0];

    expect(label.htmlFor).toBe(select.id);
    expect(label.textContent).toContain('Restaurant');
  });

  it('emits the chosen store id', () => {
    const { select, emitted } = setup();

    select.value = 'b';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual(['b']);
  });

  it('does not emit when the selection is updated from the input', () => {
    const { fixture, emitted, select } = setup('a');

    fixture.componentRef.setInput('selectedId', 'b');
    fixture.detectChanges();

    expect(select.value).toBe('b');
    expect(emitted).toEqual([]);
  });
});
