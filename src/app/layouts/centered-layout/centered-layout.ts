import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-centered-layout',
  templateUrl: './centered-layout.html',
  styleUrl: './centered-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenteredLayout {}
