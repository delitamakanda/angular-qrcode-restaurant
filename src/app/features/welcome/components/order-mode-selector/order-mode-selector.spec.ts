import { TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { OrderModeSelector } from './order-mode-selector';

describe('OrderModeSelector', () => {
  function setup(inputs: { modes: string[]; selected?: string | null; disabled?: boolean }) {
    TestBed.configureTestingModule({ providers: [provideTaiga()] });
    const fixture = TestBed.createComponent(OrderModeSelector);
    fixture.componentRef.setInput('modes', inputs.modes);
    fixture.componentRef.setInput('selected', inputs.selected ?? null);
    fixture.componentRef.setInput('disabled', inputs.disabled ?? false);
    fixture.detectChanges();
    const buttons = (): HTMLButtonElement[] =>
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    return { fixture, buttons };
  }

  it('renders only the given modes', () => {
    const { buttons } = setup({ modes: ['dine_in'] });

    expect(buttons().map((b) => b.textContent.trim())).toEqual(['Dine in']);
  });

  it('marks the selected mode as pressed', () => {
    const { buttons } = setup({ modes: ['dine_in', 'take_away'], selected: 'take_away' });

    expect(buttons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
  });

  it('emits modeSelected on click', () => {
    const { fixture, buttons } = setup({ modes: ['dine_in', 'delivery'] });
    const emitted: string[] = [];
    fixture.componentInstance.modeSelected.subscribe((m) => emitted.push(m));

    buttons()[1].click();

    expect(emitted).toEqual(['delivery']);
  });

  it('disables every button when disabled', () => {
    const { buttons } = setup({ modes: ['dine_in', 'delivery'], disabled: true });

    expect(buttons().every((b) => b.disabled)).toBe(true);
  });
});
