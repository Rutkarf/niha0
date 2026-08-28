import { AppLocale } from '../../../core/i18n/locale.service';

export type AuthLocaleKey =
  | 'loginTitle'
  | 'registerTitle'
  | 'close'
  | 'tabListLabel'
  | 'tabRegister'
  | 'tabLogin'
  | 'email'
  | 'emailPlaceholder'
  | 'company'
  | 'companyPlaceholder'
  | 'password'
  | 'passwordPlaceholder'
  | 'passwordRegisterPlaceholder'
  | 'showPassword'
  | 'hidePassword'
  | 'orContinueWith'
  | 'oauthUnavailable'
  | 'submitLogin'
  | 'submitLoginLoading'
  | 'submitRegister'
  | 'submitRegisterLoading'
  | 'validationRequired'
  | 'validationEmail'
  | 'validationPasswordMin'
  | 'validationCompanyMin';

const MESSAGES: Record<AppLocale, Record<AuthLocaleKey, string>> = {
  fr: {
    loginTitle: 'Connexion NIHAO',
    registerTitle: 'Créer un espace NIHAO',
    close: 'Fermer',
    tabListLabel: 'Mode de connexion',
    tabRegister: 'Inscription',
    tabLogin: 'Connexion',
    email: 'E-mail',
    emailPlaceholder: 'vous@entreprise.fr',
    company: 'Entreprise',
    companyPlaceholder: 'Nom de l’organisation',
    password: 'Mot de passe',
    passwordPlaceholder: '••••••••',
    passwordRegisterPlaceholder: '8 caractères minimum',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    orContinueWith: 'ou continuer avec',
    oauthUnavailable: 'Indisponible',
    submitLogin: 'Se connecter',
    submitLoginLoading: 'Connexion…',
    submitRegister: 'Continuer l’inscription',
    submitRegisterLoading: 'Redirection…',
    validationRequired: 'Champ obligatoire.',
    validationEmail: 'E-mail invalide.',
    validationPasswordMin: '8 caractères minimum.',
    validationCompanyMin: '3 caractères minimum.',
  },
  en: {
    loginTitle: 'Sign in to NIHAO',
    registerTitle: 'Create a NIHAO workspace',
    close: 'Close',
    tabListLabel: 'Authentication mode',
    tabRegister: 'Register',
    tabLogin: 'Sign in',
    email: 'Email',
    emailPlaceholder: 'you@company.com',
    company: 'Company',
    companyPlaceholder: 'Organization name',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    passwordRegisterPlaceholder: 'At least 8 characters',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    orContinueWith: 'or continue with',
    oauthUnavailable: 'Unavailable',
    submitLogin: 'Sign in',
    submitLoginLoading: 'Signing in…',
    submitRegister: 'Continue registration',
    submitRegisterLoading: 'Redirecting…',
    validationRequired: 'Required field.',
    validationEmail: 'Invalid email.',
    validationPasswordMin: 'At least 8 characters.',
    validationCompanyMin: 'At least 3 characters.',
  },
};

export function authT(locale: AppLocale, key: AuthLocaleKey): string {
  return MESSAGES[locale][key];
}
