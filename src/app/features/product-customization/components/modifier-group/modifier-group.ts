import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModifierGroup as ModifierGroupModel } from '@app/core/models/modifier.model';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { isSingleChoice, maxSelect, minSelect } from '../../utils/customization-price';

@Component({
  selector: 'app-modifier-group',
  imports: [CurrencyFormatPipe],
  templateUrl: './modifier-group.html',
  styleUrl: './modifier-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModifierGroup {
  readonly group = input.required<ModifierGroupModel>();
  /** Ids of the options currently selected in this group. */
  readonly selected = input<string[]>([]);
  readonly invalid = input(false);
  readonly optionToggled = output<string>();
  readonly cleared = output();

  protected readonly single = computed(() => isSingleChoice(this.group()));
  protected readonly isRequired = computed(() => minSelect(this.group()) > 0);
  protected readonly atMax = computed(() => this.selected().length >= maxSelect(this.group()));
  protected readonly hint = computed(() => {
    const max = maxSelect(this.group());
    return this.single() ? '' : `Choose up to ${String(max)}`;
  });

  protected isChecked(optionId: string): boolean {
    return this.selected().includes(optionId);
  }

  protected isDisabled(optionId: string, available: boolean): boolean {
    return !available || (!this.single() && this.atMax() && !this.isChecked(optionId));
  }
}
