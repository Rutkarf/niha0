import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-line-chart',
  template: `
    <svg
      class="line-chart"
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <defs>
        <linearGradient [attr.id]="gradId()" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.2" />
          <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0" />
        </linearGradient>
      </defs>
      @if (areaPoints()) {
        <polygon [attr.points]="areaPoints()" [attr.fill]="'url(#' + gradId() + ')'" />
      }
      <polyline
        [attr.points]="linePoints()"
        fill="none"
        stroke="var(--accent-primary)"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `,
  styles: [`
    .line-chart {
      width: 100%;
      height: 100px;
      display: block;
    }
  `],
})
export class DashboardLineChartComponent {
  readonly data = input.required<number[]>();
  readonly ariaLabel = input('Courbe de tendance');

  readonly gradId = computed(() => `dash-fill-${this.data().length}`);

  private readonly coords = computed(() => {
    const data = this.data();
    if (!data.length) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = 400 / Math.max(1, data.length - 1);
    return data.map((v, i) => ({
      x: i * step,
      y: 90 - ((v - min) / range) * 76,
    }));
  });

  readonly linePoints = computed(() =>
    this.coords()
      .map((p) => `${p.x},${p.y}`)
      .join(' '),
  );

  readonly areaPoints = computed(() => {
    const coords = this.coords();
    if (!coords.length) return '';
    const base = coords.map((p) => `${p.x},${p.y}`).join(' ');
    const last = coords[coords.length - 1]!;
    const first = coords[0]!;
    return `${first.x},90 ${base} ${last.x},90`;
  });
}
