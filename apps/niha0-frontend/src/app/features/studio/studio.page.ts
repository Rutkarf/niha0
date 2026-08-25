import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { AgentDefinition } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface GraphDoc {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NODE_TYPES = ['start', 'llm', 'tool', 'human', 'end'] as const;

const DEFAULT_GRAPH: GraphDoc = {
  nodes: [
    { id: 'start', type: 'start', x: 40, y: 120 },
    { id: 'llm', type: 'llm', x: 220, y: 120 },
    { id: 'end', type: 'end', x: 400, y: 120 },
  ],
  edges: [
    { from: 'start', to: 'llm' },
    { from: 'llm', to: 'end' },
  ],
};

const HITL_GRAPH: GraphDoc = {
  nodes: [
    { id: 'start', type: 'start', x: 40, y: 80 },
    { id: 'llm', type: 'llm', x: 200, y: 80 },
    { id: 'human', type: 'human', x: 360, y: 80 },
    { id: 'end', type: 'end', x: 520, y: 80 },
  ],
  edges: [
    { from: 'start', to: 'llm' },
    { from: 'llm', to: 'human' },
    { from: 'human', to: 'end' },
  ],
};

function parseGraph(raw: string | undefined | null): GraphDoc {
  try {
    const g = JSON.parse(raw || '{}') as Partial<GraphDoc>;
    const nodes = Array.isArray(g.nodes) ? g.nodes : [];
    const edges = Array.isArray(g.edges) ? g.edges : [];
    return {
      nodes: nodes.map((n, i) => ({
        id: String(n.id || `n${i}`),
        type: String(n.type || 'llm'),
        x: typeof n.x === 'number' ? n.x : 40 + i * 160,
        y: typeof n.y === 'number' ? n.y : 100,
      })),
      edges: edges.map((e) => ({ from: String(e.from), to: String(e.to) })),
    };
  } catch {
    return structuredClone(DEFAULT_GRAPH);
  }
}

function serializeGraph(g: GraphDoc): string {
  return JSON.stringify(g, null, 2);
}

@Component({
  selector: 'app-studio-page',
  imports: [
    FormsModule,
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Studio agents</h1>
          <p>Éditeur de graphes drag-and-drop · publication marketplace</p>
        </div>
      </header>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <form class="card form" (ngSubmit)="create()">
        <h2>Nouvelle définition</h2>
        <div class="templates" role="group" aria-label="Modèles">
          <button type="button" class="btn btn-ghost btn-sm" (click)="applyTemplate('default')">Simple</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="applyTemplate('hitl')">HITL</button>
        </div>
        <div class="row">
          <input class="input" placeholder="slug" [(ngModel)]="slug" name="slug" required />
          <input class="input" placeholder="Nom" [(ngModel)]="name" name="name" required />
          <input class="input" placeholder="Description" [(ngModel)]="description" name="description" />
          <button class="btn btn-primary" type="submit" [disabled]="saving()">Créer</button>
        </div>
      </form>

      <h2 class="section-title">Définitions</h2>
      @if (loading()) {
        <app-loading-state />
      } @else if (!definitions().length) {
        <app-empty-state title="Aucune définition" icon="ST" description="Créez un graphe ci-dessus." />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Slug</th><th>Nom</th><th>Version</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              @for (d of definitions(); track d.id) {
                <tr [class.selected]="selected()?.id === d.id">
                  <td>{{ d.slug }}</td>
                  <td>{{ d.name }}</td>
                  <td>v{{ d.version }}</td>
                  <td><app-status-badge [status]="d.status" /></td>
                  <td class="actions">
                    <button type="button" class="btn btn-ghost btn-sm" (click)="select(d)">Éditer</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="publish(d)">Publier</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (selected(); as sel) {
        <section class="card editor" aria-label="Éditeur de graphe">
          <div class="editor-head">
            <h2>Éditeur — {{ sel.name }}</h2>
            <div class="editor-actions">
              <button type="button" class="btn btn-ghost btn-sm" (click)="deleteSelectedNode()" [disabled]="!selectedNodeId()">
                Suppr. nœud
              </button>
              <button type="button" class="btn btn-primary btn-sm" (click)="saveEdit()" [disabled]="saving()">
                Enregistrer
              </button>
            </div>
          </div>
          <p class="hint">
            Glissez un type depuis la palette · déplacez les nœuds · cliquez deux nœuds pour créer une arête
            @if (linkFrom()) {
              <span> · liaison depuis <strong>{{ linkFrom() }}</strong>…</span>
            }
          </p>
          <div class="workspace">
            <aside class="palette" aria-label="Palette">
              @for (t of nodeTypes; track t) {
                <div
                  class="palette-item"
                  draggable="true"
                  (dragstart)="onPaletteDragStart($event, t)"
                >
                  {{ t }}
                </div>
              }
            </aside>
            <div
              class="canvas"
              (dragover)="$event.preventDefault()"
              (drop)="onCanvasDrop($event)"
              role="application"
              aria-label="Canvas graphe"
            >
              <svg class="edges" aria-hidden="true">
                @for (e of graph().edges; track e.from + '-' + e.to) {
                  @if (edgePath(e); as path) {
                    <line
                      [attr.x1]="path.x1"
                      [attr.y1]="path.y1"
                      [attr.x2]="path.x2"
                      [attr.y2]="path.y2"
                      class="edge-line"
                    />
                  }
                }
              </svg>
              @for (n of graph().nodes; track n.id) {
                <button
                  type="button"
                  class="node"
                  [class.selected]="selectedNodeId() === n.id"
                  [class.linking]="linkFrom() === n.id"
                  [style.left.px]="n.x"
                  [style.top.px]="n.y"
                  (pointerdown)="onNodePointerDown($event, n)"
                  (click)="onNodeClick(n)"
                >
                  <span class="node-type">{{ n.type }}</span>
                  <span class="node-id">{{ n.id }}</span>
                </button>
              }
            </div>
          </div>
          <details class="json-details">
            <summary>graphJson</summary>
            <pre>{{ graphJsonPreview() }}</pre>
          </details>
        </section>
      }
    </div>
  `,
  styles: `
    .error { color: var(--accent-danger); }
    .form { margin-bottom: 1rem; padding: 1rem; }
    .form h2, .editor h2 { margin: 0; font-size: 0.95rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .row .input { flex: 1; min-width: 120px; }
    .templates { display: flex; gap: 0.35rem; margin-bottom: 0.65rem; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    tr.selected td { background: color-mix(in srgb, var(--accent-primary) 10%, transparent); }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
    .actions, .editor-actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .editor { padding: 1rem; }
    .editor-head { display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; margin-bottom: 0.5rem; }
    .hint { margin: 0 0 0.75rem; font-size: 0.78rem; color: var(--text-muted); }
    .workspace { display: grid; grid-template-columns: 110px 1fr; gap: 0.75rem; min-height: 320px; }
    .palette { display: flex; flex-direction: column; gap: 0.35rem; }
    .palette-item {
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.45rem 0.5rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      cursor: grab;
      background: var(--bg-elevated);
      user-select: none;
    }
    .canvas {
      position: relative;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background:
        linear-gradient(var(--border-color) 1px, transparent 1px) 0 0 / 24px 24px,
        linear-gradient(90deg, var(--border-color) 1px, transparent 1px) 0 0 / 24px 24px,
        var(--bg-primary);
      min-height: 320px;
      overflow: hidden;
    }
    .edges { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .edge-line { stroke: var(--accent-primary); stroke-width: 2; opacity: 0.7; }
    .node {
      position: absolute;
      width: 108px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text-primary);
      padding: 0.45rem 0.5rem;
      text-align: left;
      cursor: grab;
      box-shadow: 0 1px 0 color-mix(in srgb, var(--text-primary) 8%, transparent);
      touch-action: none;
    }
    .node.selected, .node.linking { border-color: var(--accent-primary); }
    .node-type { display: block; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 650; }
    .node-id { display: block; font-size: 0.8rem; font-family: var(--font-mono); margin-top: 0.15rem; }
    .json-details { margin-top: 0.75rem; font-size: 0.78rem; }
    .json-details pre { margin: 0.5rem 0 0; font-family: var(--font-mono); font-size: 0.72rem; white-space: pre-wrap; }
    @media (max-width: 720px) {
      .workspace { grid-template-columns: 1fr; }
      .palette { flex-direction: row; flex-wrap: wrap; }
    }
  `,
})
export class StudioPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly nodeTypes = NODE_TYPES;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly definitions = signal<AgentDefinition[]>([]);
  readonly selected = signal<AgentDefinition | null>(null);
  readonly graph = signal<GraphDoc>(structuredClone(DEFAULT_GRAPH));
  readonly selectedNodeId = signal<string | null>(null);
  readonly linkFrom = signal<string | null>(null);

  slug = '';
  name = '';
  description = '';

  private dragNodeId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private paletteType: string | null = null;
  private moved = false;

  ngOnInit(): void {
    this.reload();
  }

  graphJsonPreview(): string {
    return serializeGraph(this.graph());
  }

  applyTemplate(kind: 'default' | 'hitl'): void {
    const g = structuredClone(kind === 'hitl' ? HITL_GRAPH : DEFAULT_GRAPH);
    this.graph.set(g);
    if (kind === 'hitl' && !this.slug.trim()) {
      this.slug = 'demo-hitl';
      this.name = this.name.trim() || 'Démo HITL';
    }
  }

  create(): void {
    this.error.set('');
    this.saving.set(true);
    const graphJson = serializeGraph(this.graph().nodes.length ? this.graph() : DEFAULT_GRAPH);
    this.api
      .createStudioDefinition({
        slug: this.slug.trim(),
        name: this.name.trim(),
        description: this.description.trim() || undefined,
        graphJson,
        visibility: 'PRIVATE',
        status: 'DRAFT',
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.slug = this.name = this.description = '';
          this.toast.success('Définition créée');
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          const msg = mapHttpError(err);
          this.error.set(msg);
          this.toast.error(msg);
        },
      });
  }

  select(d: AgentDefinition): void {
    this.selected.set(d);
    this.graph.set(parseGraph(d.graphJson));
    this.selectedNodeId.set(null);
    this.linkFrom.set(null);
  }

  onPaletteDragStart(ev: DragEvent, type: string): void {
    this.paletteType = type;
    ev.dataTransfer?.setData('text/plain', type);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copy';
  }

  onCanvasDrop(ev: DragEvent): void {
    ev.preventDefault();
    const type = this.paletteType || ev.dataTransfer?.getData('text/plain') || 'llm';
    this.paletteType = null;
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(8, ev.clientX - rect.left - 54);
    const y = Math.max(8, ev.clientY - rect.top - 20);
    const id = `${type}-${Date.now().toString(36).slice(-4)}`;
    this.graph.update((g) => ({
      ...g,
      nodes: [...g.nodes, { id, type, x, y }],
    }));
  }

  onNodePointerDown(ev: PointerEvent, n: GraphNode): void {
    ev.preventDefault();
    this.dragNodeId = n.id;
    this.moved = false;
    this.dragOffsetX = ev.clientX - n.x;
    this.dragOffsetY = ev.clientY - n.y;
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(ev: PointerEvent): void {
    if (!this.dragNodeId) return;
    this.moved = true;
    const x = Math.max(0, ev.clientX - this.dragOffsetX);
    const y = Math.max(0, ev.clientY - this.dragOffsetY);
    const id = this.dragNodeId;
    this.graph.update((g) => ({
      ...g,
      nodes: g.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
  }

  @HostListener('document:pointerup')
  onPointerUp(): void {
    this.dragNodeId = null;
  }

  onNodeClick(n: GraphNode): void {
    if (this.moved) {
      this.moved = false;
      this.selectedNodeId.set(n.id);
      return;
    }
    this.selectedNodeId.set(n.id);
    const from = this.linkFrom();
    if (!from) {
      this.linkFrom.set(n.id);
      return;
    }
    if (from === n.id) {
      this.linkFrom.set(null);
      return;
    }
    this.graph.update((g) => {
      const exists = g.edges.some((e) => e.from === from && e.to === n.id);
      return exists
        ? g
        : { ...g, edges: [...g.edges, { from, to: n.id }] };
    });
    this.linkFrom.set(null);
  }

  deleteSelectedNode(): void {
    const id = this.selectedNodeId();
    if (!id) return;
    this.graph.update((g) => ({
      nodes: g.nodes.filter((n) => n.id !== id),
      edges: g.edges.filter((e) => e.from !== id && e.to !== id),
    }));
    this.selectedNodeId.set(null);
    if (this.linkFrom() === id) this.linkFrom.set(null);
  }

  edgePath(e: GraphEdge): { x1: number; y1: number; x2: number; y2: number } | null {
    const g = this.graph();
    const a = g.nodes.find((n) => n.id === e.from);
    const b = g.nodes.find((n) => n.id === e.to);
    if (!a || !b) return null;
    return { x1: a.x + 54, y1: a.y + 24, x2: b.x + 54, y2: b.y + 24 };
  }

  saveEdit(): void {
    const sel = this.selected();
    if (!sel) return;
    this.saving.set(true);
    this.api
      .updateStudioDefinition(sel.id, {
        ...sel,
        graphJson: serializeGraph(this.graph()),
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.selected.set(updated);
          this.toast.success('Graphe enregistré');
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(mapHttpError(err));
        },
      });
  }

  publish(d: AgentDefinition): void {
    this.api
      .publishMarketplaceListing({
        definitionId: d.id,
        title: d.name,
        summary: d.description,
        visibility: 'PRIVATE',
      })
      .subscribe({
        next: () => this.toast.success('Publié sur le marketplace (privé)'),
        error: (err) => this.toast.error(mapHttpError(err)),
      });
  }

  private reload(): void {
    this.api.getStudioDefinitions().subscribe({
      next: (data) => {
        this.definitions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }
}
