import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { onboardingGuard } from './core/guards/onboarding.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/marketing-site/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/marketing-site/pricing.page').then((m) => m.PricingPage),
  },
  {
    path: 'use-cases',
    loadComponent: () =>
      import('./features/marketing-site/use-cases.page').then((m) => m.UseCasesPage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'accept-invite',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/accept-invite/accept-invite.page').then((m) => m.AcceptInvitePage),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/legal-marketing/privacy-policy.page').then((m) => m.PrivacyPolicyPage),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/legal-marketing/terms.page').then((m) => m.TermsPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'mfa',
    loadComponent: () =>
      import('./features/auth/mfa/mfa.page').then((m) => m.MfaPage),
  },
  {
    path: 'auth/sso-callback',
    loadComponent: () =>
      import('./features/auth/sso-callback/sso-callback.page').then((m) => m.SsoCallbackPage),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'ai-office', pathMatch: 'full' },
      {
        path: 'onboarding',
        loadComponent: () =>
          import('./features/onboarding/onboarding.page').then((m) => m.OnboardingPage),
      },
      {
        path: 'workspace',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/workspace/workspace-settings.page').then((m) => m.WorkspaceSettingsPage),
      },
      {
        path: 'data-hub',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/data/data-hub.page').then((m) => m.DataHubPage),
      },
      {
        path: 'company-data',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/company-data/company-data.page').then((m) => m.CompanyDataPage),
      },
      {
        path: 'dashboard',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'ai-office',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/ai-office/ai-office.page').then((m) => m.AiOfficePage),
      },
      {
        path: 'ai-center',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/ai-center/ai-center.page').then((m) => m.AiCenterPage),
      },
      {
        path: 'crm',
        canActivate: [onboardingGuard],
        loadComponent: () => import('./features/crm/crm.page').then((m) => m.CrmPage),
      },
      {
        path: 'sales',
        canActivate: [onboardingGuard],
        loadComponent: () => import('./features/sales/sales.page').then((m) => m.SalesPage),
      },
      {
        path: 'marketing',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/marketing/marketing.page').then((m) => m.MarketingPage),
      },
      {
        path: 'administration',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/administration/administration.page').then((m) => m.AdministrationPage),
      },
      {
        path: 'accounting',
        canActivate: [onboardingGuard, roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'MEMBER'] },
        loadComponent: () =>
          import('./features/accounting/accounting.page').then((m) => m.AccountingPage),
      },
      {
        path: 'customer-relations',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/customer-relations/customer-relations.page').then(
            (m) => m.CustomerRelationsPage,
          ),
      },
      {
        path: 'legal',
        canActivate: [onboardingGuard, roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'LEGAL', 'MEMBER'] },
        loadComponent: () => import('./features/legal/legal.page').then((m) => m.LegalPage),
      },
      {
        path: 'cms',
        canActivate: [onboardingGuard],
        data: { erpModule: 'CMS' },
        loadComponent: () => import('./features/erp/erp-crud.page').then((m) => m.ErpCrudPage),
      },
      {
        path: 'pim',
        canActivate: [onboardingGuard],
        loadComponent: () => import('./features/pim/pim.page').then((m) => m.PimPage),
      },
      {
        path: 'chat',
        canActivate: [onboardingGuard],
        loadComponent: () => import('./features/chat/chat.page').then((m) => m.ChatPage),
      },
      {
        path: 'studio',
        canActivate: [onboardingGuard],
        loadComponent: () => import('./features/studio/studio.page').then((m) => m.StudioPage),
      },
      {
        path: 'marketplace',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/marketplace/marketplace.page').then((m) => m.MarketplacePage),
      },
      {
        path: 'runtime',
        canActivate: [onboardingGuard],
        loadComponent: () => import('./features/runtime/runtime.page').then((m) => m.RuntimePage),
      },
      {
        path: 'governance',
        canActivate: [onboardingGuard, roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/governance/governance.page').then((m) => m.GovernancePage),
      },
      {
        path: 'wms',
        canActivate: [onboardingGuard, roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'OPS', 'MEMBER'] },
        loadComponent: () => import('./features/wms/wms.page').then((m) => m.WmsPage),
      },
      {
        path: 'scm',
        canActivate: [onboardingGuard],
        data: { erpModule: 'SCM' },
        loadComponent: () => import('./features/erp/erp-crud.page').then((m) => m.ErpCrudPage),
      },
      {
        path: 'mrp',
        canActivate: [onboardingGuard],
        data: { erpModule: 'MRP' },
        loadComponent: () => import('./features/erp/erp-crud.page').then((m) => m.ErpCrudPage),
      },
      {
        path: 'bi',
        canActivate: [onboardingGuard],
        loadComponent: () => import('./features/bi/bi.page').then((m) => m.BiPage),
      },
      {
        path: 'bpm',
        canActivate: [onboardingGuard],
        loadComponent: () => import('./features/bpm/bpm.page').then((m) => m.BpmPage),
      },
      {
        path: 'hcm',
        canActivate: [onboardingGuard, roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'HR', 'MEMBER'] },
        loadComponent: () => import('./features/hcm/hcm.page').then((m) => m.HcmPage),
      },
      {
        path: 'etl',
        canActivate: [onboardingGuard],
        data: { erpModule: 'ETL' },
        loadComponent: () => import('./features/erp/erp-crud.page').then((m) => m.ErpCrudPage),
      },
      {
        path: 'edi',
        canActivate: [onboardingGuard],
        data: { erpModule: 'EDI' },
        loadComponent: () => import('./features/erp/erp-crud.page').then((m) => m.ErpCrudPage),
      },
      {
        path: 'notifications',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/notifications/notifications.page').then((m) => m.NotificationsPage),
      },
      {
        path: 'audit',
        canActivate: [onboardingGuard, roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/audit/audit.page').then((m) => m.AuditPage),
      },
      {
        path: 'access-denied',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/access-denied/access-denied.page').then((m) => m.AccessDeniedPage),
      },
      {
        path: 'platform',
        canActivate: [onboardingGuard, roleGuard],
        data: { roles: ['PLATFORM_ADMIN'], strictRoles: true },
        loadComponent: () =>
          import('./features/platform/platform-admin.page').then((m) => m.PlatformAdminPage),
      },
      {
        path: 'settings',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'feedback',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/feedback/feedback.page').then((m) => m.FeedbackPage),
      },
      {
        path: 'help',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/help/help.page').then((m) => m.HelpPage),
      },
      {
        path: 'changelog',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./features/changelog/changelog.page').then((m) => m.ChangelogPage),
      },
    ],
  },
  { path: '**', redirectTo: 'app/ai-office' },
];
