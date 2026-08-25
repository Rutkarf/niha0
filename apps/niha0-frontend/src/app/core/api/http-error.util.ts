import { HttpErrorResponse } from '@angular/common/http';

export interface ApiErrorBody {
  status?: number;
  error?: string;
  code?: string;
  timestamp?: string;
}

const STATUS_MESSAGES: Record<number, string> = {
  0: 'Serveur injoignable. Vérifiez que le backend est démarré.',
  400: 'Requête invalide.',
  401: 'Session expirée ou identifiants invalides.',
  403: 'Accès refusé.',
  404: 'Ressource introuvable.',
  409: 'Conflit — cette action a déjà été traitée.',
  422: 'Données invalides.',
  500: 'Erreur serveur. Réessayez plus tard.',
};

/** Maps HTTP errors to user-safe French messages (never shows stack traces). */
export function mapHttpError(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }
  const body = err.error as ApiErrorBody | string | null;
  if (typeof body === 'object' && body?.error) {
    return body.error;
  }
  if (typeof body === 'string' && body.length > 0 && body.length < 200) {
    return body;
  }
  return STATUS_MESSAGES[err.status] ?? `${fallback} (${err.status})`;
}

export function apiErrorCode(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const body = err.error as ApiErrorBody | null;
  return body?.code ?? null;
}
