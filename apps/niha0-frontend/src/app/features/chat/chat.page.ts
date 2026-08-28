import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { Agent, ChatMessage, ChatThread } from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

type RailSection = 'home' | 'agents' | 'rag' | 'pinned';
type ThreadFilter = 'all' | 'agents' | 'direct';

const RAIL_ITEMS: { id: RailSection; label: string; icon: string }[] = [
  { id: 'home', label: 'Accueil', icon: '⌂' },
  { id: 'agents', label: 'Agents', icon: 'AI' },
  { id: 'pinned', label: 'Épinglés', icon: '★' },
  { id: 'rag', label: 'RAG', icon: '◈' },
];

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #3b82f6, #2563eb)',
];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length]!;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

@Component({
  selector: 'app-chat-page',
  imports: [FormsModule, DatePipe, NgTemplateOutlet, EmptyStateComponent, SkeletonComponent],
  template: `
    <div class="chat-workspace">
      <header class="chat-topbar">
        <div class="topbar-brand">
          <span class="brand-mark" aria-hidden="true">N</span>
          <div>
            <h1 class="topbar-title">Nihao Chat</h1>
            <p class="topbar-sub">Espace collaboratif · agents & équipes</p>
          </div>
        </div>
        @if (ragStats(); as stats) {
          <div class="rag-pills">
            <span class="pill">RAG {{ stats.chunkCount }} chunks</span>
            <span class="pill muted">{{ stats.engine }}</span>
            @if (stats.demo) {
              <span class="pill warn">Démo</span>
            }
          </div>
        }
      </header>

      @if (error()) {
        <p class="error-banner" role="alert">{{ error() }}</p>
      }

      <div class="chat-shell" [class.mobile-chat]="mobilePanel() === 'chat'">
        <!-- Rail Discord -->
        <nav class="server-rail" aria-label="Navigation workspace">
          @for (item of railItems; track item.id) {
            <button
              type="button"
              class="rail-btn"
              [class.active]="railSection() === item.id"
              [attr.title]="item.label"
              (click)="selectRail(item.id)"
            >
              <span class="rail-icon">{{ item.icon }}</span>
            </button>
          }
          <span class="rail-sep" aria-hidden="true"></span>
          @for (a of agents().slice(0, 4); track a.id) {
            <button
              type="button"
              class="rail-agent"
              [style.background]="agentGradient(a)"
              [attr.title]="a.name"
              (click)="focusAgent(a.id)"
            >
              {{ initials(a.name) }}
            </button>
          }
        </nav>

        <!-- Sidebar Instagram DMs -->
        <aside class="thread-sidebar" [class.hidden-mobile]="mobilePanel() === 'chat'">
          <header class="sidebar-head">
            <h2 class="sidebar-title">{{ sidebarTitle() }}</h2>
            <button type="button" class="icon-btn" title="Nouvelle conversation" (click)="showNewThread.set(!showNewThread())">+</button>
          </header>

          <div class="sidebar-search">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input
              class="search-input"
              type="search"
              placeholder="Rechercher une conversation…"
              [ngModel]="threadQuery()"
              (ngModelChange)="threadQuery.set($event)"
            />
          </div>

          <div class="filter-tabs" role="tablist">
            @for (f of filterOptions; track f.value) {
              <button
                type="button"
                class="filter-tab"
                [class.active]="threadFilter() === f.value"
                (click)="threadFilter.set(f.value)"
              >
                {{ f.label }}
              </button>
            }
          </div>

          @if (showNewThread()) {
            <form class="new-thread-form" (ngSubmit)="createThread()">
              <input class="input" placeholder="Nom du canal ou DM" [(ngModel)]="newTitle" name="newTitle" required />
              <select class="input" [(ngModel)]="newAgentId" name="newAgentId">
                <option value="">Sans agent — équipe</option>
                @for (a of agents(); track a.id) {
                  <option [value]="a.id">{{ a.name }}</option>
                }
              </select>
              <button class="btn btn-primary btn-block" type="submit" [disabled]="creating()">
                {{ creating() ? 'Création…' : 'Créer la conversation' }}
              </button>
            </form>
          }

          @if (loadingThreads()) {
            <app-skeleton [lines]="6" />
          } @else if (!filteredThreads().length) {
            <app-empty-state title="Aucune conversation" icon="CH" description="Créez un fil ou changez de filtre." />
          } @else {
            <div class="thread-sections">
              @if (pinnedThreads().length) {
                <section>
                  <h3 class="section-label">Épinglés</h3>
                  <ul class="thread-list" role="list">
                    @for (t of pinnedThreads(); track t.id) {
                      <ng-container *ngTemplateOutlet="threadRow; context: { $implicit: t }" />
                    }
                  </ul>
                </section>
              }
              <section>
                <h3 class="section-label">Messages</h3>
                <ul class="thread-list" role="list">
                  @for (t of filteredThreads(); track t.id) {
                    @if (!isPinned(t.id)) {
                      <ng-container *ngTemplateOutlet="threadRow; context: { $implicit: t }" />
                    }
                  }
                </ul>
              </section>
            </div>
          }
        </aside>

        <!-- Main Slack chat -->
        <main class="chat-main" [class.hidden-mobile]="mobilePanel() === 'list'">
          @if (!selectedId()) {
            <div class="chat-welcome">
                <div class="welcome-icon">💬</div>
                <h2>Bienvenue sur Nihao Chat</h2>
                <p>Sélectionnez une conversation ou créez un canal pour collaborer avec vos agents IA.</p>
                <div class="welcome-features">
                  <article><strong>Canaux</strong><span>Discussions thématiques par agent ou équipe</span></article>
                  <article><strong>DM agents</strong><span>Messages directs contextualisés RAG</span></article>
                  <article><strong>Temps réel</strong><span>Fil de messages style Slack / Instagram</span></article>
                </div>
              </div>
          } @else if (selectedThread(); as thread) {
            <header class="chat-header">
              <button type="button" class="back-mobile icon-btn" (click)="mobilePanel.set('list')" aria-label="Retour">←</button>
              <div class="header-avatar" [style.background]="threadGradient(thread)">
                {{ threadInitials(thread) }}
                <span class="online-dot" aria-hidden="true"></span>
              </div>
              <div class="header-info">
                <h2 class="header-title">{{ thread.title }}</h2>
                <p class="header-meta">
                  {{ agentName(thread.agentId) }}
                  @if (ragStats(); as stats) {
                    · RAG {{ stats.chunkCount }} docs
                  }
                </p>
              </div>
              <div class="header-actions">
                <button type="button" class="icon-btn" [class.active]="isPinned(thread.id)" (click)="togglePin(thread.id)" title="Épingler">★</button>
                <button type="button" class="icon-btn" title="Membres">👥</button>
                <button type="button" class="icon-btn" title="Infos">ⓘ</button>
              </div>
            </header>

            @if (loadingMessages()) {
              <app-skeleton message="Chargement des messages…" [lines]="8" />
            } @else {
              <div #msgScroll class="message-stream" role="log" aria-live="polite">
                <div class="stream-start">
                  <div class="start-avatar" [style.background]="threadGradient(thread)">{{ threadInitials(thread) }}</div>
                  <h3>Début de #{{ thread.title }}</h3>
                  <p>Ceci est le début de la conversation avec {{ agentName(thread.agentId) }}.</p>
                </div>

                @for (group of messageGroups(); track group.key) {
                  <div class="date-divider"><span>{{ group.label }}</span></div>
                  @for (m of group.messages; track m.id) {
                    <article class="message-row" [class.mine]="m.role === 'user'" [class.theirs]="m.role !== 'user'">
                      @if (m.role !== 'user') {
                        <div class="msg-avatar" [style.background]="threadGradient(thread)">
                          {{ assistantInitials() }}
                        </div>
                      }
                      <div class="bubble-wrap">
                        <header class="bubble-head">
                          <span class="sender">{{ roleLabel(m.role) }}</span>
                          @if (m.createdAt) {
                            <time>{{ m.createdAt | date: 'HH:mm' }}</time>
                          }
                          @if (metaBadge(m); as badge) {
                            <span class="meta-chip" [class.demo]="badge.demo">{{ badge.label }}</span>
                          }
                        </header>
                        <div class="bubble" [class.mine]="m.role === 'user'">
                          <p>{{ m.content }}</p>
                        </div>
                      </div>
                    </article>
                  }
                } @empty {
                  <app-empty-state title="Aucun message" icon="CH" description="Envoyez le premier message ci-dessous." />
                }

                @if (sending()) {
                  <div class="typing-row">
                    <div class="msg-avatar" [style.background]="threadGradient(thread)">{{ assistantInitials() }}</div>
                    <div class="typing-bubble">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                }
              </div>

              <footer class="composer-bar">
                <div class="composer-tools">
                  <button type="button" class="tool-btn" title="Joindre">📎</button>
                  <button type="button" class="tool-btn" title="Emoji">☺</button>
                  <button type="button" class="tool-btn" title="Mention">&#64;</button>
                </div>
                <form class="composer-form" (ngSubmit)="send()">
                  <textarea
                    class="composer-input"
                    placeholder="Écrire un message dans #{{ thread.title }}…"
                    rows="1"
                    [(ngModel)]="draft"
                    name="draft"
                    (keydown.enter)="onEnter($event)"
                    required
                  ></textarea>
                  <button class="send-btn" type="submit" [disabled]="sending() || !draft.trim()" title="Envoyer">
                    ➤
                  </button>
                </form>
              </footer>
            }
          }
        </main>

        <!-- Members panel (Slack-style) -->
        @if (selectedThread()) {
          <aside class="members-panel" aria-label="Membres">
            <h3 class="members-title">En ligne</h3>
            <ul class="member-list">
              <li>
                <span class="member-avatar you">VO</span>
                <span class="member-name">Vous</span>
                <span class="member-role">Humain</span>
              </li>
              @if (selectedThread()?.agentId; as aid) {
                @if (agentById(aid); as agent) {
                  <li>
                    <span class="member-avatar" [style.background]="agentGradient(agent)">{{ initials(agent.name) }}</span>
                    <span class="member-name">{{ agent.name }}</span>
                    <span class="member-role">Agent IA</span>
                  </li>
                }
              }
              @for (a of agents().slice(0, 5); track a.id) {
                <li>
                  <span class="member-avatar" [style.background]="agentGradient(a)">{{ initials(a.name) }}</span>
                  <span class="member-name">{{ a.name }}</span>
                  <span class="member-role">{{ a.domain }}</span>
                </li>
              }
            </ul>
            @if (ragStats(); as stats) {
              <h3 class="members-title">Contexte RAG</h3>
              <dl class="rag-dl">
                <dt>Moteur</dt><dd>{{ stats.engine }}</dd>
                <dt>Embeddings</dt><dd>{{ stats.embeddingProvider }}</dd>
                <dt>Chunks</dt><dd>{{ stats.chunkCount }}</dd>
              </dl>
            }
          </aside>
        }
      </div>
    </div>

    <ng-template #threadRow let-t>
      <li>
        <button
          type="button"
          class="thread-item"
          [class.active]="selectedId() === t.id"
          (click)="selectThread(t)"
        >
          <span class="thread-avatar" [style.background]="threadGradient(t)">{{ threadInitials(t) }}</span>
          <span class="thread-body">
            <span class="thread-row-top">
              <span class="thread-name">{{ t.title }}</span>
              @if (t.updatedAt) {
                <time class="thread-time">{{ t.updatedAt | date: 'HH:mm' }}</time>
              }
            </span>
            <span class="thread-preview">{{ threadPreview(t) }}</span>
          </span>
          @if (selectedId() === t.id && messages().length) {
            <span class="unread-dot" aria-hidden="true"></span>
          }
        </button>
      </li>
    </ng-template>
  `,
  styles: [`
    :host {
      display: block;
      height: calc(100vh - var(--shell-header-h, 56px));
      min-height: 32rem;
    }

    .chat-workspace {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary);
    }

    .chat-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--dash-inline-gap);
      padding: 0.65rem 1rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-elevated);
      flex-shrink: 0;
    }

    .topbar-brand { display: flex; align-items: center; gap: 0.65rem; min-width: 0; }
    .brand-mark {
      width: 2rem;
      height: 2rem;
      border-radius: 0.65rem;
      background: linear-gradient(135deg, var(--accent-primary), #8b5cf6);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 0.9rem;
    }

    .topbar-title { margin: 0; font-size: 0.95rem; font-weight: var(--fw-bold); }
    .topbar-sub { margin: 0; font-size: 0.68rem; color: var(--text-muted); }

    .rag-pills { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .pill {
      font-size: 0.65rem;
      font-weight: var(--fw-semibold);
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }
    .pill.muted { color: var(--text-muted); }
    .pill.warn { border-color: color-mix(in srgb, var(--accent-warning) 50%, var(--border-color)); color: var(--accent-warning); }

    .error-banner {
      margin: 0;
      padding: 0.5rem 1rem;
      background: color-mix(in srgb, var(--accent-danger) 12%, transparent);
      color: var(--accent-danger);
      font-size: 0.8rem;
    }

    .chat-shell {
      flex: 1;
      display: grid;
      grid-template-columns: 4rem minmax(220px, 300px) 1fr minmax(180px, 220px);
      min-height: 0;
      overflow: hidden;
    }

    /* Discord rail */
    .server-rail {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      padding: 0.65rem 0.4rem;
      background: color-mix(in srgb, var(--bg-elevated) 92%, #000 8%);
      border-right: 1px solid var(--border-color);
      overflow-y: auto;
    }

    .rail-btn, .rail-agent {
      width: 2.65rem;
      height: 2.65rem;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: grid;
      place-items: center;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-size: 0.72rem;
      font-weight: var(--fw-bold);
      transition: border-radius 0.15s, background 0.15s;
    }

    .rail-btn:hover, .rail-agent:hover { border-radius: 35%; background: var(--accent-primary); color: #fff; }
    .rail-btn.active { border-radius: 35%; background: var(--accent-primary); color: #fff; }
    .rail-icon { font-size: 0.85rem; }
    .rail-sep { width: 1.5rem; height: 2px; background: var(--border-color); margin: 0.25rem 0; }
    .rail-agent { color: #fff; font-size: 0.62rem; }

    /* Instagram sidebar */
    .thread-sidebar {
      display: flex;
      flex-direction: column;
      min-width: 0;
      border-right: 1px solid var(--border-color);
      background: var(--bg-elevated);
      overflow: hidden;
    }

    .sidebar-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 0.85rem 0.5rem;
    }

    .sidebar-title { margin: 0; font-size: 1rem; font-weight: var(--fw-bold); }

    .icon-btn {
      width: 1.85rem;
      height: 1.85rem;
      border: none;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .icon-btn:hover { background: var(--bg-secondary); }
    .icon-btn.active { color: var(--accent-warning); }

    .sidebar-search {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0 0.65rem 0.5rem;
      padding: 0.4rem 0.65rem;
      border-radius: 0.65rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .search-icon { color: var(--text-muted); font-size: 0.85rem; }
    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 0.8rem;
      color: var(--text-primary);
      outline: none;
      min-width: 0;
    }

    .filter-tabs {
      display: flex;
      gap: 0.25rem;
      padding: 0 0.65rem 0.5rem;
    }

    .filter-tab {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 0.68rem;
      font-weight: var(--fw-semibold);
      color: var(--text-muted);
      padding: 0.35rem 0.25rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .filter-tab.active { background: color-mix(in srgb, var(--accent-primary) 12%, transparent); color: var(--accent-primary); }

    .new-thread-form {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding: 0 0.65rem 0.65rem;
      border-bottom: 1px solid var(--border-color);
    }

    .btn-block { width: 100%; }

    .thread-sections {
      flex: 1;
      overflow-y: auto;
      padding: 0 0.35rem 0.65rem;
    }

    .section-label {
      margin: 0.5rem 0.35rem 0.25rem;
      font-size: 0.62rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      font-weight: var(--fw-bold);
    }

    .thread-list { list-style: none; margin: 0; padding: 0; }

    .thread-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0.5rem;
      border: none;
      border-radius: 0.65rem;
      background: transparent;
      cursor: pointer;
      text-align: left;
      color: inherit;
      position: relative;
    }

    .thread-item:hover { background: var(--bg-secondary); }
    .thread-item.active { background: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-secondary)); }

    .thread-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      font-size: 0.72rem;
      font-weight: var(--fw-bold);
      color: #fff;
    }

    .thread-body { flex: 1; min-width: 0; }
    .thread-row-top { display: flex; justify-content: space-between; gap: 0.35rem; align-items: baseline; }
    .thread-name { font-size: 0.82rem; font-weight: var(--fw-semibold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .thread-time { font-size: 0.62rem; color: var(--text-muted); flex-shrink: 0; }
    .thread-preview { display: block; font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 0.1rem; }
    .unread-dot { width: 0.45rem; height: 0.45rem; border-radius: 50%; background: var(--accent-primary); flex-shrink: 0; }

    /* Slack main */
    .chat-main {
      display: flex;
      flex-direction: column;
      min-width: 0;
      background: var(--bg-primary);
    }

    .chat-welcome {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
      gap: 0.65rem;
    }

    .welcome-icon { font-size: 2.5rem; }
    .chat-welcome h2 { margin: 0; font-size: 1.25rem; }
    .chat-welcome p { margin: 0; color: var(--text-muted); max-width: 28rem; font-size: 0.85rem; }

    .welcome-features {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.65rem;
      margin-top: 1rem;
      max-width: 36rem;
      width: 100%;
    }

    .welcome-features article {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      text-align: left;
    }
    .welcome-features strong { display: block; font-size: 0.78rem; margin-bottom: 0.2rem; }
    .welcome-features span { font-size: 0.68rem; color: var(--text-muted); }

    .chat-header {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.65rem 1rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-elevated);
      flex-shrink: 0;
    }

    .back-mobile { display: none; }

    .header-avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.72rem;
      font-weight: var(--fw-bold);
      color: #fff;
      position: relative;
      flex-shrink: 0;
    }

    .online-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      background: #22c55e;
      border: 2px solid var(--bg-elevated);
    }

    .header-info { flex: 1; min-width: 0; }
    .header-title { margin: 0; font-size: 0.95rem; font-weight: var(--fw-bold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .header-meta { margin: 0; font-size: 0.68rem; color: var(--text-muted); }
    .header-actions { display: flex; gap: 0.15rem; }

    .message-stream {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.25rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .stream-start {
      text-align: center;
      padding: 1.5rem 1rem 1rem;
      margin-bottom: 0.5rem;
    }

    .start-avatar {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      margin: 0 auto 0.65rem;
      display: grid;
      place-items: center;
      font-size: 1rem;
      font-weight: var(--fw-bold);
      color: #fff;
    }

    .stream-start h3 { margin: 0 0 0.25rem; font-size: 1.1rem; }
    .stream-start p { margin: 0; font-size: 0.78rem; color: var(--text-muted); }

    .date-divider {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin: 0.65rem 0;
      color: var(--text-muted);
      font-size: 0.68rem;
      font-weight: var(--fw-semibold);
    }

    .date-divider::before, .date-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-color);
    }

    .message-row {
      display: flex;
      gap: 0.55rem;
      align-items: flex-start;
      max-width: 85%;
    }

    .message-row.mine {
      margin-left: auto;
      flex-direction: row-reverse;
    }

    .msg-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      font-size: 0.62rem;
      font-weight: var(--fw-bold);
      color: #fff;
      margin-top: 0.15rem;
    }

    .bubble-wrap { min-width: 0; max-width: 100%; }
    .message-row.mine .bubble-wrap { align-items: flex-end; display: flex; flex-direction: column; }

    .bubble-head {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.15rem;
      flex-wrap: wrap;
    }

    .message-row.mine .bubble-head { flex-direction: row-reverse; }

    .sender { font-size: 0.68rem; font-weight: var(--fw-bold); color: var(--text-secondary); }
    .bubble-head time { font-size: 0.62rem; color: var(--text-muted); }

    .meta-chip {
      font-size: 0.58rem;
      padding: 0.1rem 0.35rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }
    .meta-chip.demo { color: var(--accent-warning); border-color: color-mix(in srgb, var(--accent-warning) 40%, var(--border-color)); }

    .bubble {
      padding: 0.55rem 0.85rem;
      border-radius: 1.1rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      max-width: 100%;
    }

    .bubble.mine {
      background: linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 75%, #8b5cf6));
      border-color: transparent;
      color: #fff;
      border-bottom-right-radius: 0.25rem;
    }

    .message-row.theirs .bubble { border-top-left-radius: 0.25rem; }

    .bubble p { margin: 0; font-size: 0.88rem; white-space: pre-wrap; line-height: 1.45; word-break: break-word; }

    .typing-row { display: flex; gap: 0.55rem; align-items: center; }
    .typing-bubble {
      display: flex;
      gap: 0.25rem;
      padding: 0.65rem 0.85rem;
      border-radius: 1rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
    }
    .typing-bubble span {
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
      background: var(--text-muted);
      animation: bounce 1.2s ease-in-out infinite;
    }
    .typing-bubble span:nth-child(2) { animation-delay: 0.15s; }
    .typing-bubble span:nth-child(3) { animation-delay: 0.3s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-4px); opacity: 1; }
    }

    .composer-bar {
      padding: 0.65rem 1rem 0.85rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-elevated);
      flex-shrink: 0;
    }

    .composer-tools { display: flex; gap: 0.15rem; margin-bottom: 0.35rem; }
    .tool-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.95rem;
      padding: 0.2rem 0.35rem;
      border-radius: var(--radius-sm);
      opacity: 0.75;
    }
    .tool-btn:hover { background: var(--bg-secondary); opacity: 1; }

    .composer-form {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      padding: 0.45rem 0.45rem 0.45rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 1.25rem;
      background: var(--bg-primary);
    }

    .composer-input {
      flex: 1;
      border: none;
      background: transparent;
      resize: none;
      font-size: 0.88rem;
      color: var(--text-primary);
      outline: none;
      min-height: 1.4rem;
      max-height: 6rem;
      line-height: 1.4;
      font-family: inherit;
    }

    .send-btn {
      width: 2.1rem;
      height: 2.1rem;
      border: none;
      border-radius: 50%;
      background: var(--accent-primary);
      color: #fff;
      cursor: pointer;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Members panel */
    .members-panel {
      border-left: 1px solid var(--border-color);
      background: var(--bg-elevated);
      padding: 0.85rem;
      overflow-y: auto;
      min-width: 0;
    }

    .members-title {
      margin: 0 0 0.5rem;
      font-size: 0.62rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      font-weight: var(--fw-bold);
    }

    .member-list { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }

    .member-list li {
      display: grid;
      grid-template-columns: 1.75rem 1fr auto;
      gap: 0.45rem;
      align-items: center;
      font-size: 0.72rem;
    }

    .member-avatar {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.55rem;
      font-weight: var(--fw-bold);
      color: #fff;
    }
    .member-avatar.you { background: linear-gradient(135deg, #64748b, #475569); }

    .member-name { font-weight: var(--fw-semibold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .member-role { font-size: 0.62rem; color: var(--text-muted); }

    .rag-dl {
      margin: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.25rem 0.65rem;
      font-size: 0.72rem;
    }
    .rag-dl dt { color: var(--text-muted); }
    .rag-dl dd { margin: 0; font-weight: var(--fw-semibold); }

    @media (max-width: 1100px) {
      .chat-shell { grid-template-columns: 4rem minmax(200px, 260px) 1fr; }
      .members-panel { display: none; }
      .welcome-features { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .chat-shell { grid-template-columns: 1fr; }
      .server-rail { display: none; }
      .thread-sidebar.hidden-mobile, .chat-main.hidden-mobile { display: none; }
      .back-mobile { display: grid; place-items: center; }
      .chat-shell.mobile-chat { grid-template-columns: 1fr; }
    }
  `],
})
export class ChatPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly msgScroll = viewChild<ElementRef<HTMLElement>>('msgScroll');

  readonly railItems = RAIL_ITEMS;
  readonly filterOptions: { value: ThreadFilter; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'agents', label: 'Agents' },
    { value: 'direct', label: 'Direct' },
  ];

  readonly initials = initials;

  readonly loadingAgents = signal(true);
  readonly loadingThreads = signal(true);
  readonly loadingMessages = signal(false);
  readonly creating = signal(false);
  readonly sending = signal(false);
  readonly error = signal('');
  readonly agents = signal<Agent[]>([]);
  readonly threads = signal<ChatThread[]>([]);
  readonly messages = signal<ChatMessage[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly ragStats = signal<{
    chunkCount: number;
    engine: string;
    embeddingProvider: string;
    demo: boolean;
  } | null>(null);

  readonly threadQuery = signal('');
  readonly threadFilter = signal<ThreadFilter>('all');
  readonly railSection = signal<RailSection>('home');
  readonly showNewThread = signal(false);
  readonly mobilePanel = signal<'list' | 'chat'>('list');
  readonly pinnedIds = signal<Set<string>>(new Set());

  newTitle = 'général';
  newAgentId = '';
  draft = '';

  readonly selectedThread = computed(() => {
    const id = this.selectedId();
    return this.threads().find((t) => t.id === id) ?? null;
  });

  readonly filteredThreads = computed(() => {
    const q = this.threadQuery().trim().toLowerCase();
    const filter = this.threadFilter();
    const rail = this.railSection();
    let list = this.threads();

    if (filter === 'agents') list = list.filter((t) => !!t.agentId);
    if (filter === 'direct') list = list.filter((t) => !t.agentId);

    if (rail === 'agents') list = list.filter((t) => !!t.agentId);
    if (rail === 'pinned') list = list.filter((t) => this.isPinned(t.id));

    if (q) {
      list = list.filter((t) => {
        const agent = this.agentName(t.agentId).toLowerCase();
        return t.title.toLowerCase().includes(q) || agent.includes(q);
      });
    }

    return list;
  });

  readonly pinnedThreads = computed(() =>
    this.threads().filter((t) => this.isPinned(t.id)),
  );

  readonly sidebarTitle = computed(() => {
    switch (this.railSection()) {
      case 'agents':
        return 'Agents IA';
      case 'pinned':
        return 'Épinglés';
      case 'rag':
        return 'Contexte RAG';
      default:
        return 'Messages';
    }
  });

  readonly messageGroups = computed(() => {
    const msgs = this.messages();
    const groups: { key: string; label: string; messages: ChatMessage[] }[] = [];
    const map = new Map<string, ChatMessage[]>();

    for (const m of msgs) {
      const key = m.createdAt?.slice(0, 10) ?? 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }

    for (const [key, messages] of map) {
      groups.push({ key, label: this.dateGroupLabel(key), messages });
    }
    return groups;
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (list) => {
        this.agents.set(list);
        this.loadingAgents.set(false);
      },
      error: () => this.loadingAgents.set(false),
    });
    this.api.getRagStats().subscribe({
      next: (stats) => this.ragStats.set(stats),
      error: () => this.ragStats.set(null),
    });
    this.reloadThreads();
  }

  selectRail(section: RailSection): void {
    this.railSection.set(section);
    if (section === 'rag') this.showNewThread.set(false);
  }

  focusAgent(agentId: string): void {
    this.threadFilter.set('agents');
    this.railSection.set('agents');
    const existing = this.threads().find((t) => t.agentId === agentId);
    if (existing) {
      this.selectThread(existing);
      return;
    }
    const agent = this.agentById(agentId);
    if (!agent) return;
    this.newTitle = agent.name;
    this.newAgentId = agentId;
    this.showNewThread.set(true);
  }

  isPinned(id: string): boolean {
    return this.pinnedIds().has(id);
  }

  togglePin(id: string): void {
    this.pinnedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  agentById(id: string | undefined): Agent | undefined {
    if (!id) return undefined;
    return this.agents().find((a) => a.id === id);
  }

  agentName(agentId?: string): string {
    return this.agentById(agentId)?.name ?? 'Équipe Nihao';
  }

  agentGradient(agent: Agent): string {
    return hashColor(agent.code || agent.id);
  }

  threadGradient(thread: ChatThread): string {
    const agent = this.agentById(thread.agentId);
    return hashColor(agent?.code ?? thread.title);
  }

  threadInitials(thread: ChatThread): string {
    const agent = this.agentById(thread.agentId);
    return agent ? initials(agent.name) : initials(thread.title);
  }

  assistantInitials(): string {
    const thread = this.selectedThread();
    return thread ? this.threadInitials(thread) : 'AI';
  }

  threadPreview(thread: ChatThread): string {
    if (this.selectedId() === thread.id && this.messages().length) {
      const last = this.messages()[this.messages().length - 1];
      if (last) return last.content.slice(0, 60) + (last.content.length > 60 ? '…' : '');
    }
    return this.agentName(thread.agentId) + ' · Conversation active';
  }

  roleLabel(role: string): string {
    if (role === 'user') return 'Vous';
    if (role === 'assistant') return this.agentName(this.selectedThread()?.agentId) || 'Assistant';
    return role;
  }

  metaBadge(m: ChatMessage): { label: string; demo: boolean } | null {
    if (m.role !== 'assistant' || !m.metadataJson) return null;
    try {
      const meta = JSON.parse(m.metadataJson) as { provider?: string; rag?: boolean; ragHits?: number; demo?: boolean };
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

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.send();
    }
  }

  createThread(): void {
    this.creating.set(true);
    this.api
      .createChatThread({
        title: this.newTitle.trim() || 'général',
        agentId: this.newAgentId || undefined,
      })
      .subscribe({
        next: (t) => {
          this.creating.set(false);
          this.newTitle = 'général';
          this.newAgentId = '';
          this.showNewThread.set(false);
          this.toast.success('Conversation créée.');
          this.reloadThreads(() => this.selectThread(t));
        },
        error: (err) => {
          this.creating.set(false);
          this.toast.error(mapHttpError(err));
        },
      });
  }

  selectThread(t: ChatThread): void {
    this.selectedId.set(t.id);
    this.mobilePanel.set('chat');
    this.loadingMessages.set(true);
    this.api.getChatMessages(t.id).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.loadingMessages.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        this.loadingMessages.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }

  send(): void {
    const id = this.selectedId();
    if (!id || !this.draft.trim()) return;
    this.sending.set(true);
    const content = this.draft.trim();
    this.api.postChatMessage(id, content).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.draft = '';
        this.messages.update((list) => [...list, res.userMessage, res.assistantMessage]);
        this.scrollToBottom();
      },
      error: (err) => {
        this.sending.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }

  private dateGroupLabel(isoDate: string): string {
    if (isoDate === 'unknown') return 'Messages';
    const d = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.msgScroll()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
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
        this.toast.error(mapHttpError(err));
      },
    });
  }
}
