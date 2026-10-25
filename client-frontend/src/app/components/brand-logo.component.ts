import { Component, computed, inject, input } from '@angular/core';
import { ThemeService } from '../services/theme.service';

// BitTrader mark (public/logos). The cream version is for dark backgrounds, the near-black one for light ones.
// `surface` says what the logo sits on: 'brand' is the brown sidebar and sign-in screens, which are dark in both
// themes, so it always uses cream; 'page' is the page background, so it follows light/dark mode.
@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `<img [src]="src()" [width]="size()" [height]="size()" alt="" draggable="false" />`,
  styles: [`
    :host { display: inline-flex; flex: none; }
    img { display: block; object-fit: contain; user-select: none; }
  `]
})
export class BrandLogoComponent {
  readonly size = input(28);
  readonly surface = input<'brand' | 'page'>('brand');

  private readonly theme = inject(ThemeService);

  readonly src = computed(() =>
    this.surface() === 'brand' || this.theme.mode() === 'dark' ? 'logos/logo-dark-mode.png' : 'logos/logo-light-mode.png');
}
