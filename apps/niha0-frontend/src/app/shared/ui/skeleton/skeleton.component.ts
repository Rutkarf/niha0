import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  template: `
    <div class="skel" aria-busy="true" aria-live="polite">
      <span class="sr-only">{{ message() }}</span>
      @for (i of bars(); track i) {
        <div class="row" [style.width.%]="widths[i % widths.length]"></div>
      }
    </div>
  `,
  styles: `
    .skel {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
    }
    .row {
      height: 0.85rem;
      border-radius: var(--radius-sm);
      background: linear-gradient(
        90deg,
        var(--bg-hover) 0%,
        color-mix(in srgb, var(--bg-hover) 40%, var(--bg-elevated)) 50%,
        var(--bg-hover) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
    }
    @keyframes shimmer {
      from { background-position: 100% 0; }
      to { background-position: -100% 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .row { animation: none; opacity: 0.7; }
    }
  `,
})
export class SkeletonComponent {
  readonly message = input('Chargement…');
  readonly lines = input(4);
  readonly widths = [92, 78, 88, 64, 84, 70];
  readonly bars = computed(() =>
    Array.from({ length: Math.min(6, Math.max(1, this.lines())) }, (_, i) => i),
  );
}
