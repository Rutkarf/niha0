import { ApplicationConfig, APP_INITIALIZER, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { TenancyService } from './core/tenancy/tenancy.service';

function initApp(auth: AuthService, theme: ThemeService, tenancy: TenancyService): () => Promise<void> {
  return async () => {
    theme.setMode(theme.mode());
    const me = await auth.loadMe();
    if (me) {
      await tenancy.refreshOrganizationName();
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor, authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AuthService, ThemeService, TenancyService],
      multi: true,
    },
  ],
};
