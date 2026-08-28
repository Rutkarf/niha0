import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, AgentDefinition } from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

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

const STUDIO_TEMPLATES: { id: 'default' | 'hitl'; label: string; keywords: string }[] = [
  { id: 'default', label: 'Simple', keywords: 'start llm end basique' },
  { id: 'hitl', label: 'HITL', keywords: 'human validation interrupt demo-hitl' },
];

@Component({
  selector: 'app-studio-page',
  imports: [
    FormsModule,
    RouterLink,
    EmptyStateComponent,
    SkeletonComponent,
    StatusBadgeComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header group="Pilotage" title="Studio agents" backLabel="← AI Office">
        <div actions>
          <a routerLink="/app/marketplace" class="btn btn-ghost">Marketplace</a>
        </div>
      </app-feature-page-header>

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="analytics"
        sectionLabel="Studio de graphes agents"
        officeLinkLabel="Studio"
      />

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="studio-pair-row">
        <section class="feature-hub card studio-half new-def-section">
          <header class="section-toolbar new-def-toolbar" role="toolbar" aria-label="Nouvelle définition">
            <h2 class="section-title">Nouvelle définition</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Template, slug, nom…"
                [ngModel]="templateQuery()"
                (ngModelChange)="templateQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Graphe agent</span>
            </div>
          </header>

          <form class="studio-form" (ngSubmit)="create()">
            <div class="def-form-bar">
              <label class="label def-field">
                <span class="field-label">Slug</span>
                <input class="input" [(ngModel)]="slug" name="slug" required maxlength="64" placeholder="mon-agent" />
              </label>
              <label class="label def-field">
                <span class="field-label">Nom</span>
                <input class="input" [(ngModel)]="name" name="name" required maxlength="160" placeholder="Mon agent" />
              </label>
              <label class="label def-field def-field-wide">
                <span class="field-label">Description</span>
                <input class="input" [(ngModel)]="description" name="description" maxlength="500" placeholder="Optionnel" />
              </label>
              <div class="def-submit">
                <button class="btn btn-primary" type="submit" [disabled]="saving() || !slug.trim() || !name.trim()">
                  {{ saving() ? '…' : 'Créer la définition' }}
                </button>
              </div>
            </div>

            @if (filteredTemplates().length) {
              <div class="template-row" role="group" aria-label="Modèles">
                @for (t of filteredTemplates(); track t.id) {
                  <button
                    type="button"
                    class="template-chip"
                    [class.active]="activeTemplate() === t.id"
                    (click)="applyTemplate(t.id)"
                  >
                    {{ t.label }}
                  </button>
                }
              </div>
            }
          </form>
        </section>

        <section class="feature-hub card studio-half defs-section">
          <header class="section-toolbar" role="toolbar" aria-label="Définitions">
            <h2 class="section-title">Définitions</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Slug, nom, statut…"
                [ngModel]="defQuery()"
                (ngModelChange)="defQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Catalogue graphes</span>
              <span class="section-count">{{ definitions().length }} graphe(s)</span>
            </div>
          </header>
          @if (loading()) {
            <app-skeleton [lines]="5" />
          } @else if (!definitions().length) {
            <app-empty-state title="Aucune définition" icon="ST" description="Créez un graphe à gauche." />
          } @else {
            @if (filteredDefs().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-body def-scroll" [style.max-height.rem]="visibleRows * rowHeightRem">
              @for (d of filteredDefs(); track d.id) {
                <div class="def-row" [class.selected]="selected()?.id === d.id">
                  <div class="def-info">
                    <strong>{{ d.name }}</strong>
                    <span class="def-sub">{{ d.slug }} · v{{ d.version }}</span>
                    <app-status-badge [status]="d.status" />
                  </div>
                  <div class="def-actions">
                    <button type="button" class="btn btn-ghost btn-sm" (click)="select(d)">Éditer</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="publish(d)">Publier</button>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      </div>

      @if (selected(); as sel) {
        <section class="feature-hub card editor" aria-label="Éditeur de graphe">
          <div class="editor-head">
            <h2 class="feature-hub-title">Éditeur — {{ sel.name }}</h2>
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
    .studio-pair-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--dash-inline-gap); margin-bottom: var(--dash-inline-gap); }
    .studio-half { min-width: 0; display: flex; flex-direction: column; }

    .section-toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
    }

    .new-def-toolbar {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      min-width: 0;
    }

    .new-def-toolbar .section-title { flex: 0 0 auto; }
    .new-def-toolbar .section-search {
      flex: 1 1 auto;
      min-width: 0;
      max-width: none;
      justify-self: unset;
    }
    .new-def-toolbar .section-toolbar-end { flex: 0 1 auto; justify-self: unset; }

    .section-title {
      margin: 0;
      font-size: 1rem;
      font-weight: var(--fw-bold);
      white-space: nowrap;
    }

    .section-search {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      justify-self: center;
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    .section-search-input {
      flex: 1;
      min-width: 0;
      font-size: 0.85rem;
    }

    .section-toolbar-end {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      justify-self: end;
      white-space: nowrap;
    }

    .section-tag {
      font-size: 0.72rem;
      font-weight: var(--fw-semibold);
      color: var(--text-secondary);
    }

    .section-count {
      font-size: 0.72rem;
      color: var(--text-muted);
      padding: 0.2rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
    }

    .new-def-section,
    .defs-section {
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .table-hint { margin: 0; }

    .def-form-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--dash-inline-gap);
    }

    .def-field { flex: 1 1 8rem; min-width: 0; margin: 0; }
    .def-field-wide { flex: 1.4 1 12rem; }
    .def-submit { flex: 0 0 auto; padding-bottom: 0.05rem; }

    .field-label {
      font-size: 0.72rem;
      font-weight: var(--fw-semibold);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; }

    .template-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: var(--dash-inline-gap);
      padding-top: var(--dash-inline-gap);
      border-top: 1px solid var(--border-color);
    }

    .template-chip {
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-size: 0.72rem;
      font-weight: var(--fw-semibold);
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      cursor: pointer;
    }

    .template-chip:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
    .template-chip.active {
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }

    .def-scroll { display: flex; flex-direction: column; gap: 0.35rem; overflow-y: auto; }
    .def-row { display: flex; justify-content: space-between; gap: 0.5rem; padding: 0.6rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); align-items: center; }
    .def-row.selected { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 10%, transparent); }
    .def-info strong { display: block; font-size: 0.85rem; }
    .def-sub { display: block; font-size: 0.72rem; color: var(--text-muted); }
    .def-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
    .actions, .editor-actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .editor { padding: 0; }
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
    @media (max-width: 960px) {
      .studio-pair-row { grid-template-columns: 1fr; }
      .new-def-toolbar { flex-wrap: wrap; }
      .new-def-toolbar .section-search { flex: 1 1 100%; order: 2; }
      .new-def-toolbar .section-title { order: 1; }
      .new-def-toolbar .section-toolbar-end { order: 3; }
      .def-form-bar { flex-direction: column; align-items: stretch; }
      .def-submit .btn { width: 100%; }
      .section-toolbar { grid-template-columns: 1fr; }
      .section-search { justify-self: stretch; }
      .section-toolbar-end { justify-self: start; flex-wrap: wrap; }
    }
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
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;
  readonly loadingAgent = signal(true);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly definitions = signal<AgentDefinition[]>([]);
  readonly selected = signal<AgentDefinition | null>(null);
  readonly graph = signal<GraphDoc>(structuredClone(DEFAULT_GRAPH));
  readonly selectedNodeId = signal<string | null>(null);
  readonly linkFrom = signal<string | null>(null);
  readonly defQuery = signal('');
  readonly templateQuery = signal('');
  readonly activeTemplate = signal<'default' | 'hitl' | null>(null);

  readonly filteredTemplates = computed(() => {
    const q = this.templateQuery().trim().toLowerCase();
    if (!q) return STUDIO_TEMPLATES;
    return STUDIO_TEMPLATES.filter(
      (t) => t.label.toLowerCase().includes(q) || t.keywords.toLowerCase().includes(q) || t.id.includes(q),
    );
  });

  readonly filteredDefs = computed(() => {
    const q = this.defQuery().trim().toLowerCase();
    const list = this.definitions();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.slug.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q),
    );
  });

  slug = '';
  name = '';
  description = '';

  private dragNodeId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private paletteType: string | null = null;
  private moved = false;

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (list) => {
        this.agent.set(list.find((a) => a.code === 'ANALYTICS') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  graphJsonPreview(): string {
    return serializeGraph(this.graph());
  }

  applyTemplate(kind: 'default' | 'hitl'): void {
    this.activeTemplate.set(kind);
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
    this.api.getStudioDefinition(d.id).subscribe({
      next: (fresh) => {
        this.selected.set(fresh);
        this.graph.set(parseGraph(fresh.graphJson));
        this.selectedNodeId.set(null);
        this.linkFrom.set(null);
      },
      error: () => {
        this.selected.set(d);
        this.graph.set(parseGraph(d.graphJson));
      },
    });
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
