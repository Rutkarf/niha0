import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-sparkline',
  template: `
    <svg
      class="sparkline"
      [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
      [attr.width]="width()"
      [attr.height]="height()"
      aria-hidden="true"
    >
      <polyline [attr.points]="points()" fill="none" [attr.stroke]="color()" stroke-width="1.5" />
    </svg>
  `,
  styles: [`
    .sparkline { display: block; flex-shrink: 0; }
  `],
})
export class DashboardSparklineComponent {
  readonly data = input.required<number[]>();
  readonly width = input(56);
  readonly height = input(22);
  readonly color = input('var(--accent-primary)');

  readonly points = computed(() => {
    const data = this.data();
    if (data.length < 2) return '';
    const w = this.width();
    const h = this.height();
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');
  });
}
