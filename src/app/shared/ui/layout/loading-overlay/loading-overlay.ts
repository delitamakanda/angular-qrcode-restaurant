import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../../state/ui.store';

@Component({
  selector: 'app-loading-overlay',
  imports: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.css',
})
export class LoadingOverlay {
  readonly uiStore = inject(UiStore);
}
