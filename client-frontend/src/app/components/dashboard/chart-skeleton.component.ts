import { Component } from '@angular/core';

// Loading placeholder shaped like the chart it stands in for: a ghost line and fill with axis label stubs, pulsing
// gently, so nothing jumps when the real chart arrives.
@Component({
  selector: 'app-chart-skeleton',
  standalone: true,
  host: { 'aria-hidden': 'true', class: 'chart-skeleton' },
  template: `
    <div class="ghost-plot">
      <svg viewBox="0 0 600 200" preserveAspectRatio="none">
        <path class="ghost-area" d="M0,150 C40,146 70,122 110,126 S190,92 235,102 S315,142 360,114 S440,62 485,72 S560,44 600,34 L600,200 L0,200 Z"/>
        <path class="ghost-line" d="M0,150 C40,146 70,122 110,126 S190,92 235,102 S315,142 360,114 S440,62 485,72 S560,44 600,34"/>
      </svg>
      <div class="ghost-y">
        @for (i of stubs5; track i) { <span></span> }
      </div>
    </div>
    <div class="ghost-x">
      @for (i of stubs6; track i) { <span></span> }
    </div>
  `,
  styles: [`
    :host {
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      gap: .5rem;
      height: 100%;
      animation: ghost-pulse 1.4s ease-in-out infinite alternate;
    }

    .ghost-plot {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 3.5rem;
      gap: .75rem;
      min-height: 0;
    }

    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .ghost-area {
      fill: color-mix(in oklab, var(--clr-border) 35%, transparent);
    }

    .ghost-line {
      fill: none;
      stroke: var(--clr-border-mid);
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
      stroke-linecap: round;
    }

    .ghost-y,
    .ghost-x {
      display: flex;
      justify-content: space-between;
    }

    .ghost-y {
      flex-direction: column;
      padding: .5rem 0;
    }

    .ghost-x {
      padding-right: 4.25rem;
    }

    .ghost-y span,
    .ghost-x span {
      display: block;
      height: .5rem;
      border-radius: var(--radius-pill);
      background: var(--clr-surface-soft);
    }

    .ghost-y span { width: 100%; }
    .ghost-x span { width: 2rem; }

    @keyframes ghost-pulse {
      from { opacity: .5; }
      to { opacity: 1; }
    }
  `]
})
export class ChartSkeletonComponent {
  readonly stubs5 = [1, 2, 3, 4, 5];
  readonly stubs6 = [1, 2, 3, 4, 5, 6];
}
