import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { ProductNote } from './product-note';

describe('ProductNote', () => {
  function render() {
    const control = new FormControl('', { nonNullable: true });
    const fixture = TestBed.createComponent(ProductNote);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
    return { control, el: fixture.nativeElement as HTMLElement };
  }

  it('renders a labelled textarea', () => {
    const { el } = render();
    const textarea = el.querySelector('textarea');

    expect(textarea?.closest('label')?.textContent).toContain('Note');
    expect(textarea?.getAttribute('maxlength')).toBe('200');
  });

  it('writes typed text to the control', () => {
    const { control, el } = render();
    const textarea = el.getElementsByTagName('textarea')[0];

    textarea.value = 'extra hot';
    textarea.dispatchEvent(new Event('input'));

    expect(control.value).toBe('extra hot');
  });
});
