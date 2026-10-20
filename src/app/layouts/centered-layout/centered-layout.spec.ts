import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CenteredLayout } from './centered-layout';

@Component({
  imports: [CenteredLayout],
  template: `<app-centered-layout><p>Hello</p></app-centered-layout>`,
})
class Host {}

describe('CenteredLayout', () => {
  it('renders the projected content', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('main p')?.textContent).toBe('Hello');
  });
});
