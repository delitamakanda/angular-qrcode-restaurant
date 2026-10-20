import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiIcon, TuiInput, TuiLabel, TuiTextfield } from '@taiga-ui/core';
import { map, of, switchMap, timer } from 'rxjs';

export const SEARCH_DEBOUNCE_MS = 250;

@Component({
  selector: 'app-product-search',
  imports: [ReactiveFormsModule, TuiTextfield, TuiLabel, TuiIcon, TuiInput],
  templateUrl: './product-search.html',
  styleUrl: './product-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSearch {
  readonly value = input('');
  readonly searchChange = output<string>();

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  private lastEmitted = '';

  constructor() {
    effect(() => {
      const value = this.value();
      this.lastEmitted = value.trim();
      this.searchControl.setValue(value, { emitEvent: false });
    });

    this.searchControl.valueChanges
      .pipe(
        map((term) => term.trim()),
        // Clearing is emitted immediately; typing waits for a pause.
        switchMap((term) =>
          term === '' ? of(term) : timer(SEARCH_DEBOUNCE_MS).pipe(map(() => term)),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((term) => {
        if (term === this.lastEmitted) {
          return;
        }
        this.lastEmitted = term;
        this.searchChange.emit(term);
      });
  }

  focus(): void {
    this.field()?.nativeElement.focus();
  }
}
