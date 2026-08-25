import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieConsentComponent } from './shared/ui/cookie-consent/cookie-consent.component';
import { ToastHostComponent } from './shared/ui/toast/toast-host.component';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CookieConsentComponent, ToastHostComponent, ConfirmDialogComponent],
  template: `
    <a class="skip-link" href="#main-content">Aller au contenu</a>
    <router-outlet />
    <app-toast-host />
    <app-confirm-dialog />
    <app-cookie-consent />
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .skip-link {
      position: absolute;
      left: var(--space-3);
      top: -100px;
      z-index: calc(var(--z-modal) + 1);
      padding: var(--space-2) var(--space-3);
      background: var(--accent-primary);
      color: var(--on-accent);
      border-radius: var(--radius-sm);
      font-weight: var(--fw-bold);
      font-size: var(--fs-md);
    }
    .skip-link:focus {
      top: var(--space-3);
      outline: var(--focus-ring-width) solid var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
  `],
})
export class App {}
