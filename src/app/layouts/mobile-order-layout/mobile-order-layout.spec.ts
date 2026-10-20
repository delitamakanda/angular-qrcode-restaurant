import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MobileOrderLayout } from './mobile-order-layout';

@Component({
  imports: [MobileOrderLayout],
  template: `
    <app-mobile-order-layout>
      <header layout-header id="h">Header</header>
      <p id="c">Content</p>
      <div layout-footer id="f">Footer</div>
    </app-mobile-order-layout>
  `,
})
class Host {}

describe('MobileOrderLayout', () => {
  it('projects header, content and footer in their zones', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const mains = el.querySelectorAll('main');
    expect(mains.length).toBe(1);
    expect(mains[0].querySelector('#c')?.textContent).toBe('Content');
    expect(mains[0].querySelector('#h')).toBeNull();
    expect(mains[0].querySelector('#f')).toBeNull();
    expect(el.querySelector('.mobile-order-layout__footer #f')).not.toBeNull();

    const order = Array.from(el.querySelectorAll('#h, #c, #f')).map((n) => n.id);
    expect(order).toEqual(['h', 'c', 'f']);
  });
});
