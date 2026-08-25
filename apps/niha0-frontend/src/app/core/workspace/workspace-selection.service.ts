import { Injectable, signal } from '@angular/core';

export type WorkspaceSelection =
  | { kind: 'agent'; id: string; code: string }
  | { kind: 'ceo' }
  | { kind: 'library'; id: string }
  | null;

/**
 * Centralized selection shared by sidebar, AI Office panels, and Three.js scene.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceSelectionService {
  readonly selection = signal<WorkspaceSelection>(null);

  selectAgent(id: string, code: string): void {
    this.selection.set({ kind: 'agent', id, code });
  }

  selectCeo(): void {
    this.selection.set({ kind: 'ceo' });
  }

  selectLibrary(id: string): void {
    this.selection.set({ kind: 'library', id: id.toUpperCase() });
  }

  clear(): void {
    this.selection.set(null);
  }

  isLibrarySelected(id: string): boolean {
    const s = this.selection();
    return s?.kind === 'library' && s.id === id.toUpperCase();
  }
}
