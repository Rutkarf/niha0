import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';
import { focusFirstElement, getFocusableElements } from './focusable.util';

/**
 * Traps keyboard focus inside modal dialogs (WCAG 2.4.3).
 * Restores focus to the previously focused element on destroy.
 */
@Directive({ selector: '[appFocusTrap]', standalone: true })
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private previouslyFocused: HTMLElement | null = null;

  @Input({ alias: 'appFocusTrap' }) enabled = true;
  @Input() focusTrapAutoFocus = true;

  ngAfterViewInit(): void {
    if (!this.enabled) return;
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    if (this.focusTrapAutoFocus) {
      queueMicrotask(() => focusFirstElement(this.host.nativeElement));
    }
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus?.();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.enabled || event.key !== 'Tab') return;
    const focusable = getFocusableElements(this.host.nativeElement);
    if (focusable.length < 2) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
