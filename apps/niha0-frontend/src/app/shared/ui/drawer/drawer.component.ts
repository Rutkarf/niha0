import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-drawer',
  template: `
    @if (open()) {
      <div class="panel-overlay" role="presentation" (click)="closed.emit()">
        <aside
          class="panel-slide"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          (click)="$event.stopPropagation()"
        >
          <header class="head">
            <h2>{{ title() }}</h2>
            <button type="button" class="close" (click)="closed.emit()" aria-label="Fermer">×</button>
          </header>
          <div class="body">
            <ng-content />
          </div>
          @if (showFooter()) {
            <footer class="foot">
              <ng-content select="[drawerFooter]" />
            </footer>
          }
        </aside>
      </div>
    }
  `,
  styles: `
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border-color);
    }
    h2 {
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--fs-lg);
    }
    .close {
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 1.35rem;
      cursor: pointer;
      line-height: 1;
    }
    .body {
      flex: 1;
      overflow: auto;
    }
    .foot {
      margin-top: var(--space-4);
      padding-top: var(--space-3);
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
    :host ::ng-deep .panel-slide {
      display: flex;
      flex-direction: column;
    }
  `,
})
export class DrawerComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly showFooter = input(false);
  readonly closed = output<void>();
}
