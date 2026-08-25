import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProfessionalWorkspaceService } from '../workspace/professional-workspace.service';

/**
 * Blocks app routes until organization onboarding is COMPLETED.
 * Onboarding and workspace settings remain reachable to finish the flow.
 */
export const onboardingGuard: CanActivateFn = async (_route, state) => {
  const workspace = inject(ProfessionalWorkspaceService);
  const router = inject(Router);

  await workspace.hydrate();
  const status = workspace.profile().onboardingStatus;
  if (status === 'COMPLETED') {
    return true;
  }

  const path = state.url.split('?')[0] ?? state.url;
  if (path.startsWith('/app/onboarding') || path.startsWith('/app/workspace')) {
    return true;
  }

  sessionStorage.setItem('niha0_redirect', state.url);
  return router.createUrlTree(['/app/onboarding']);
};
