import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <app-empty-state [title]="title()" [description]="description()" [icon]="icon()">
      <button type="button">Voir le menu</button>
    </app-empty-state>
  `,
})
class Host {
  readonly title = input('Votre panier est vide');
  readonly description = input<string>();
  readonly icon = input<string>();
}

function setup(inputs: Record<string, string> = {}) {
  TestBed.configureTestingModule({ providers: [provideTaiga()] });
  const fixture = TestBed.createComponent(Host);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('EmptyState', () => {
  it('renders the title in a heading and exposes a status role', () => {
    const el = setup();

    expect(el.querySelector('h2')?.textContent).toContain('Votre panier est vide');
    expect(el.querySelector('[role="status"]')).not.toBeNull();
  });

  it('renders neither description nor icon when absent', () => {
    const el = setup();

    expect(el.querySelector('p')).toBeNull();
    expect(el.querySelector('tui-icon')).toBeNull();
  });

  it('renders the description and a decorative icon when provided', () => {
    const el = setup({ description: 'Ajoutez des produits.', icon: '@tui.shopping-cart' });

    expect(el.querySelector('p')?.textContent).toContain('Ajoutez des produits.');
    expect(el.querySelector('tui-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('projects the provided content', () => {
    const el = setup();

    expect(el.querySelector('button')?.textContent).toContain('Voir le menu');
  });
});
