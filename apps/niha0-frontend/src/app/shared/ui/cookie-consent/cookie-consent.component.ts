import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const STORAGE_KEY = 'niha0_cookie_consent';

@Component({
  selector: 'app-cookie-consent',
  imports: [RouterLink],
  template: `
    @if (visible()) {
      <div class="cookie-banner" role="dialog" aria-label="Consentement cookies">
        <p>
          NIHAO utilise des cookies essentiels pour la session et des cookies analytiques optionnels.
          <a routerLink="/privacy">Politique de confidentialité</a>
        </p>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="decline()">Refuser</button>
          <button type="button" class="btn btn-primary" (click)="accept()">Accepter</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .cookie-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem 1rem;
      padding: 0.85rem 1.25rem;
      background: color-mix(in srgb, var(--bg-elevated) 95%, transparent);
      border-top: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      font-size: 0.82rem;
      color: var(--text-secondary);
    }
    .cookie-banner p { margin: 0; max-width: 52rem; line-height: 1.45; }
    .actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
  `],
})
export class CookieConsentComponent implements OnInit {
  readonly visible = signal(false);

  ngOnInit(): void {
    this.visible.set(!localStorage.getItem(STORAGE_KEY));
  }

  accept(): void {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    this.visible.set(false);
  }

  decline(): void {
    localStorage.setItem(STORAGE_KEY, 'declined');
    this.visible.set(false);
  }
}
