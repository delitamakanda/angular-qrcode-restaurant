import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-note',
  imports: [ReactiveFormsModule],
  templateUrl: './product-note.html',
  styleUrl: './product-note.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductNote {
  readonly control = input.required<FormControl<string>>();
  readonly maxLength = input(200);
}
