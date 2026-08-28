/** WCAG 2.4.3 — focusable elements inside a dialog or landmark region. */
const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-hidden') !== 'true' &&
      el.tabIndex !== -1 &&
      (el.offsetParent !== null || el === document.activeElement),
  );
}

export function focusFirstElement(root: HTMLElement): void {
  const focusable = getFocusableElements(root);
  (focusable[0] ?? root).focus();
}
