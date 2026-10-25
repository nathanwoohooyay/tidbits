import { Component, computed, input } from '@angular/core';

export type SkeletonVariant = 'holding' | 'history' | 'market' | 'account';

// Loading rows laid out like the real rows they stand in for (logo, name, figures, buttons in the same columns),
// so the list doesn't jump when data arrives.
@Component({
  selector: 'app-skeleton-rows',
  standalone: true,
  host: { 'aria-busy': 'true', 'aria-label': 'Loading', role: 'status' },
  template: `
    @for (i of items(); track i) {
      <div class="sk-row" [class]="'sk-row sk-' + variant()" [style.opacity]="1 - i * .12">
        @switch (variant()) {
          @case ('holding') {
            <span class="skeleton sk-logo"></span>
            <span class="sk-stack"><span class="skeleton sk-l w40"></span><span class="skeleton sk-s w70"></span></span>
            <span class="sk-stack end"><span class="skeleton sk-l w80"></span><span class="skeleton sk-s w50"></span></span>
            <span class="skeleton sk-pill"></span>
          }
          @case ('history') {
            <span class="skeleton sk-s w80"></span>
            <span class="sk-ident"><span class="skeleton sk-logo sm"></span><span class="sk-stack"><span class="skeleton sk-l w60"></span><span class="skeleton sk-s w90"></span></span></span>
            <span class="skeleton sk-badge"></span>
            <span class="skeleton sk-l w70 end"></span>
            <span class="skeleton sk-l w40 end"></span>
            <span class="skeleton sk-l w80 end"></span>
            <span class="skeleton sk-badge"></span>
          }
          @case ('market') {
            <span class="sk-ident"><span class="skeleton sk-logo"></span><span class="sk-stack"><span class="skeleton sk-l w40"></span><span class="skeleton sk-s w70"></span></span></span>
            <span class="skeleton sk-spark"></span>
            <span class="skeleton sk-l w60 end"></span>
            <span class="skeleton sk-l w50 end"></span>
            <span class="skeleton sk-pill"></span>
          }
          @case ('account') {
            <span class="sk-ident"><span class="skeleton sk-logo sm"></span><span class="sk-stack"><span class="skeleton sk-l w50"></span><span class="skeleton sk-s w80"></span></span></span>
            <span class="skeleton sk-spark"></span>
            <span class="skeleton sk-l w70 end"></span>
            <span class="skeleton sk-l w60 end"></span>
            <span class="skeleton sk-pill"></span>
          }
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .sk-row {
      display: grid;
      align-items: center;
      gap: 1rem;
      padding: .75rem 0;
    }

    .sk-holding { grid-template-columns: 2rem minmax(0, 1fr) 5rem 3.5rem; }
    .sk-history { grid-template-columns: 8rem minmax(0, 1.4fr) 3rem repeat(3, minmax(0, .8fr)) 4rem; }
    .sk-market { grid-template-columns: minmax(0, 1.6fr) 5rem repeat(2, minmax(0, .7fr)) 3.5rem; }
    .sk-account { grid-template-columns: minmax(0, 2fr) 5rem repeat(2, minmax(0, 1fr)) 5rem; }

    .sk-ident {
      display: flex;
      align-items: center;
      gap: .75rem;
      min-width: 0;
    }

    .sk-stack {
      display: grid;
      gap: .5rem;
      flex: 1;
      min-width: 0;
    }

    .sk-stack.end,
    .end {
      justify-items: end;
      justify-self: end;
    }

    .sk-logo {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      flex: none;
    }

    .sk-logo.sm {
      width: 1.5rem;
      height: 1.5rem;
    }

    .sk-l { height: .75rem; }
    .sk-s { height: .5rem; }

    .sk-pill {
      width: 3.5rem;
      height: 1.6rem;
      border-radius: var(--radius-pill);
    }

    .sk-badge {
      width: 2.75rem;
      height: 1.1rem;
      border-radius: var(--radius-pill);
    }

    .sk-spark {
      height: 1.25rem;
      border-radius: var(--radius-sm);
    }

    .w40 { width: 40%; }
    .w50 { width: 50%; }
    .w60 { width: 60%; }
    .w70 { width: 70%; }
    .w80 { width: 80%; }
    .w90 { width: 90%; }

    @media (max-width: 640px) {
      .sk-history { grid-template-columns: 5rem minmax(0, 1fr) 3rem 4rem; }
      .sk-history > :nth-child(n + 5) { display: none; }
      .sk-market { grid-template-columns: minmax(0, 1fr) repeat(2, 4rem) 3.5rem; }
      .sk-market .sk-spark { display: none; }
      .sk-account { grid-template-columns: minmax(0, 1fr) 5rem; }
      .sk-account > :nth-child(n + 4) { display: none; }
      .sk-account .sk-spark { display: none; }
    }
  `]
})
export class SkeletonRowsComponent {
  readonly variant = input<SkeletonVariant>('holding');
  readonly rows = input(5);
  readonly items = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
}
