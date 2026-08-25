import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { ChatMessage, ChatThread } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-chat-page',
  imports: [FormsModule, RouterLink, LoadingStateComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Chat agents</h1>
          <p>Conversations avec RAG documents, mémoire de session et guardrails</p>
        </div>
      </header>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="layout">
        <aside class="threads card" aria-label="Fils de conversation">
          <form class="new-thread" (ngSubmit)="createThread()">
            <label class="sr-only" for="threadTitle">Titre du fil</label>
            <input
              id="threadTitle"
              class="input"
              placeholder="Titre du fil"
              [(ngModel)]="newTitle"
              name="newTitle"
              required
            />
            <button class="btn btn-primary btn-sm" type="submit" [disabled]="creating()">Nouveau</button>
          </form>

          @if (loadingThreads()) {
            <app-loading-state message="Fils…" />
          } @else if (!threads().length) {
            <app-empty-state title="Aucun fil" icon="CH" description="Créez une conversation." />
          } @else {
            <ul class="thread-list" role="list">
              @for (t of threads(); track t.id) {
                <li>
                  <button
                    type="button"
                    class="thread-btn"
                    [class.active]="selectedId() === t.id"
                    [attr.aria-current]="selectedId() === t.id ? 'true' : null"
                    (click)="selectThread(t)"
                  >
                    {{ t.title }}
                  </button>
                </li>
              }
            </ul>
          }
        </aside>

        <section class="messages card" aria-label="Messages">
          @if (!selectedId()) {
            <app-empty-state title="Sélectionnez un fil" icon="CH" />
          } @else if (loadingMessages()) {
            <app-loading-state message="Messages…" />
          } @else {
            <div class="msg-list" role="log" aria-live="polite">
              @for (m of messages(); track m.id) {
                <div class="msg" [class.user]="m.role === 'user'" [class.assistant]="m.role === 'assistant'">
                  <div class="msg-meta">
                    <span class="role">{{ roleLabel(m.role) }}</span>
                    @if (metaBadge(m); as badge) {
                      <span class="badge" [class.demo]="badge.demo">{{ badge.label }}</span>
                    }
                  </div>
                  <p>{{ m.content }}</p>
                </div>
              } @empty {
                <app-empty-state title="Aucun message" icon="CH" description="Envoyez le premier message." />
              }
            </div>
            <form class="composer" (ngSubmit)="send()">
              <label class="sr-only" for="chatDraft">Votre message</label>
              <input
                id="chatDraft"
                class="input"
                placeholder="Votre message…"
                [(ngModel)]="draft"
                name="draft"
                required
              />
              <button class="btn btn-primary" type="submit" [disabled]="sending() || !draft.trim()">
                Envoyer
              </button>
            </form>
          }
        </section>
      </div>
    </div>
  `,
  styles: `
    .error { color: var(--accent-danger); }
    .layout {
      display: grid;
      grid-template-columns: minmax(200px, 280px) 1fr;
      gap: 1rem;
      min-height: 420px;
    }
    @media (max-width: 720px) {
      .layout { grid-template-columns: 1fr; }
    }
    .threads, .messages {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .new-thread { display: flex; gap: 0.5rem; }
    .new-thread .input { flex: 1; }
    .thread-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem; }
    .thread-btn {
      width: 100%;
      text-align: left;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-primary);
      border-radius: var(--radius-md);
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .thread-btn.active { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 12%, transparent); }
    .msg-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.65rem; max-height: 480px; }
    .msg {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.65rem 0.85rem;
      background: var(--bg-primary);
    }
    .msg.user { border-color: color-mix(in srgb, var(--accent-primary) 40%, var(--border-color)); }
    .msg-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .msg .role { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 650; }
    .badge {
      font-size: 0.65rem;
      font-weight: 650;
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm, 4px);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      background: var(--bg-elevated);
    }
    .badge.demo {
      border-color: color-mix(in srgb, var(--accent-warning, #d97706) 50%, var(--border-color));
      color: var(--accent-warning, #d97706);
    }
    .msg p { margin: 0.35rem 0 0; font-size: 0.9rem; white-space: pre-wrap; }
    .composer { display: flex; gap: 0.5rem; }
    .composer .input { flex: 1; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;
    }
  `,
})
export class ChatPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly loadingThreads = signal(true);
  readonly loadingMessages = signal(false);
  readonly creating = signal(false);
  readonly sending = signal(false);
  readonly error = signal('');
  readonly threads = signal<ChatThread[]>([]);
  readonly messages = signal<ChatMessage[]>([]);
  readonly selectedId = signal<string | null>(null);

  newTitle = 'Conversation';
  draft = '';

  ngOnInit(): void {
    this.reloadThreads();
  }

  roleLabel(role: string): string {
    if (role === 'user') return 'Vous';
    if (role === 'assistant') return 'Assistant';
    return role;
  }

  metaBadge(m: ChatMessage): { label: string; demo: boolean } | null {
    if (m.role !== 'assistant' || !m.metadataJson) return null;
    try {
      const meta = JSON.parse(m.metadataJson) as {
        provider?: string;
        rag?: boolean;
        ragHits?: number;
        demo?: boolean;
      };
      const parts: string[] = [];
      if (meta.provider) parts.push(meta.provider);
      if (meta.rag) parts.push(`RAG ${meta.ragHits ?? 0}`);
      else parts.push('sans RAG');
      if (meta.demo) parts.push('démo');
      return { label: parts.join(' · '), demo: !!meta.demo };
    } catch {
      return null;
    }
  }

  createThread(): void {
    this.error.set('');
    this.creating.set(true);
    this.api.createChatThread({ title: this.newTitle.trim() || 'Conversation' }).subscribe({
      next: (t) => {
        this.creating.set(false);
        this.newTitle = 'Conversation';
        this.toast.success('Fil créé');
        this.reloadThreads(() => this.selectThread(t));
      },
      error: (err) => {
        this.creating.set(false);
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  selectThread(t: ChatThread): void {
    this.selectedId.set(t.id);
    this.loadingMessages.set(true);
    this.api.getChatMessages(t.id).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.loadingMessages.set(false);
      },
      error: (err) => {
        this.loadingMessages.set(false);
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  send(): void {
    const id = this.selectedId();
    if (!id || !this.draft.trim()) return;
    this.error.set('');
    this.sending.set(true);
    const content = this.draft.trim();
    this.api.postChatMessage(id, content).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.draft = '';
        this.messages.update((list) => [...list, res.userMessage, res.assistantMessage]);
      },
      error: (err) => {
        this.sending.set(false);
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  private reloadThreads(after?: () => void): void {
    this.api.getChatThreads().subscribe({
      next: (data) => {
        this.threads.set(data);
        this.loadingThreads.set(false);
        after?.();
      },
      error: (err) => {
        this.loadingThreads.set(false);
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }
}
