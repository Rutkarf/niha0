import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied-page',
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="card box">
        <p class="module-code">403</p>
        <h1>Accès refusé</h1>
        <p>
          Votre rôle ne permet pas d’ouvrir cette section.
          @if (from()) {
            <span> ({{ from() }})</span>
          }
        </p>
        <div class="actions">
          <a routerLink="/app/dashboard" class="btn btn-primary">Dashboard</a>
          <a routerLink="/app/ai-office" class="btn btn-ghost">AI Office</a>
        </div>
      </div>
    </div>
  `,
  styles: `
    .box { max-width: 420px; padding: var(--space-5); }
    h1 { margin: 0 0 var(--space-2); font-family: var(--font-display); }
    p { color: var(--text-secondary); margin: 0 0 var(--space-4); }
    .actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  `,
})
export class AccessDeniedPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly from = signal('');

  ngOnInit(): void {
    this.from.set(this.route.snapshot.queryParamMap.get('from') ?? '');
  }
}
