/** Normalise les variantes historiques du nom démo. */
export function normalizeCompanyName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '';
  if (trimmed === 'OptimusTest') return 'Optimus Test';
  return trimmed;
}

/** Libellé UI : société cliente (ex. Société : Optimus Test). */
export function companyLabel(name: string | null | undefined, fallback = 'Organisation'): string {
  const normalized = normalizeCompanyName(name) || fallback;
  return `Société : ${normalized}`;
}
