import { Injectable, computed, signal } from '@angular/core';

export type AppLocale = 'fr' | 'en';

type DictKey =
  | 'login'
  | 'logout'
  | 'settings'
  | 'save'
  | 'cancel'
  | 'loading'
  | 'email'
  | 'password'
  | 'forgotPassword'
  | 'language';

const DICT: Record<AppLocale, Record<DictKey, string>> = {
  fr: {
    login: 'Connexion',
    logout: 'Déconnexion',
    settings: 'Paramètres',
    save: 'Enregistrer',
    cancel: 'Annuler',
    loading: 'Chargement…',
    email: 'Email',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    language: 'Langue',
  },
  en: {
    login: 'Sign in',
    logout: 'Sign out',
    settings: 'Settings',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading…',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    language: 'Language',
  },
};

const STORAGE_KEY = 'niha0_locale';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly localeSignal = signal<AppLocale>(this.load());

  readonly locale = this.localeSignal.asReadonly();
  readonly isFrench = computed(() => this.localeSignal() === 'fr');

  t(key: DictKey): string {
    return DICT[this.localeSignal()][key];
  }

  setLocale(locale: AppLocale): void {
    this.localeSignal.set(locale);
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }

  private load(): AppLocale {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'fr') return stored;
    const nav = typeof navigator !== 'undefined' ? navigator.language : 'fr';
    return nav.startsWith('en') ? 'en' : 'fr';
  }
}
