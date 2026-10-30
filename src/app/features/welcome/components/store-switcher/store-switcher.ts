import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@app/core/models/store.model';

@Component({
  selector: 'app-store-switcher',
  imports: [ReactiveFormsModule],
  templateUrl: './store-switcher.html',
  styleUrl: './store-switcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreSwitcher {
  private readonly destroyRef = inject(DestroyRef);

  readonly stores = input.required<readonly Store[]>();
  readonly selectedId = input<string | null>(null);
  readonly storeSelected = output<string>();

  protected readonly control = new FormControl<string>('', { nonNullable: true });

  constructor() {
    effect(() => {
      this.control.setValue(this.selectedId() ?? '', { emitEvent: false });
    });

    this.control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      if (id && id !== this.selectedId()) {
        this.storeSelected.emit(id);
      }
    });
  }
}
