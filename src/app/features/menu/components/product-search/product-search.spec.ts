import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { ProductSearch } from './product-search';

@Component({
  imports: [ProductSearch],
  template: `<app-product-search [value]="value()" (searchChange)="changes.push($event)" />`,
})
class Host {
  readonly value = signal('');
  readonly changes: string[] = [];
}

describe('ProductSearch', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [provideTaiga()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#menu-search');
    if (!input) {
      throw new Error('Missing search input');
    }
    const type = (text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input'));
    };
    return { fixture, el, input, type, host: fixture.componentInstance };
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders a label bound to the input and a decorative icon', () => {
    const { el } = render();

    expect(el.querySelector('label[for="menu-search"]')?.textContent).toContain('Search a product');
    expect(el.querySelector('tui-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('emits once after the debounce for rapid typing', () => {
    const { type, host } = render();

    type('p');
    vi.advanceTimersByTime(100);
    type('pi');
    vi.advanceTimersByTime(100);
    type('piz');
    expect(host.changes).toEqual([]);
    vi.advanceTimersByTime(250);

    expect(host.changes).toEqual(['piz']);
  });

  it('emits an empty term immediately when cleared', () => {
    const { type, host } = render();

    type('pizza');
    vi.advanceTimersByTime(250);
    type('');

    expect(host.changes).toEqual(['pizza', '']);
  });

  it('does not emit the same value twice', () => {
    const { type, host } = render();

    type('tea');
    vi.advanceTimersByTime(250);
    type('tea ');
    vi.advanceTimersByTime(250);

    expect(host.changes).toEqual(['tea']);
  });

  it('syncs the value input to the field without emitting', () => {
    const { fixture, input, host } = render();

    host.value.set('latte');
    fixture.detectChanges();
    vi.advanceTimersByTime(250);

    expect(input.value).toBe('latte');
    expect(host.changes).toEqual([]);
  });
});
