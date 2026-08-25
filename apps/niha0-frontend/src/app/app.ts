import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieConsentComponent } from './shared/ui/cookie-consent/cookie-consent.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CookieConsentComponent],
  template: `
    <router-outlet />
    <app-cookie-consent />
  `,
  styles: [`:host { display: block; min-height: 100vh; }`],
})
export class App {}
