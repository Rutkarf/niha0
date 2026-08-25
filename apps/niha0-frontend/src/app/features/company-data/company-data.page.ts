import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProfessionalWorkspaceService } from '../../core/workspace/professional-workspace.service';
import { DATA_FILE_ACCEPT, DATA_MAX_BYTES } from '../../core/workspace/professional-presets';
import { mapHttpError } from '../../core/api/http-error.util';
import { ApiService } from '../../core/api/api.service';
import type { CompanyDataAsset } from '../../core/workspace/professional.models';

function formatRagEngineLabel(stats: {
  engine: string;
  embeddingProvider: string;
  demo: boolean;
}): string {
  if (stats.demo || stats.engine === 'hash-embedding-demo') {
    return 'Embeddings démo (hash)';
  }
  if (stats.engine === 'hybrid-rag' || stats.embeddingProvider === 'openai') {
    return 'Recherche vectorielle (OpenAI)';
  }
  return 'Recherche par mots-clés';
}

@Component({
  selector: 'app-company-data-page',
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/workspace" class="back-ao">← Workspace</a>
          <h1>Données de l’entreprise</h1>
          <p>
            Importez des fichiers texte/CSV/JSON pour indexation RAG ({{ ragChunks() }} chunk(s)).
            @if (ragEngineLabel()) {
              <span class="rag-engine">{{ ragEngineLabel() }}</span>
            }
            Les agents enrichissent leurs recommandations avec ce contexte.
          </p>
        </div>
      </header>

      <section
        class="dropzone card"
        [class.active]="dragOver()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragOver.set(false)"
        (drop)="onDrop($event)"
      >
        <p>Glissez-déposez vos fichiers ici</p>
        <label class="btn btn-primary file-btn">
          Sélectionner des fichiers
          <input type="file" multiple [accept]="accept" hidden (change)="onFiles($event)" />
        </label>
        <p class="hint">PDF, CSV, XLSX, TXT, DOCX, JSON, images — max 15 Mo / fichier</p>
        @if (uploading()) {
          <div class="progress" role="progressbar" [attr.aria-valuenow]="uploadProgress()" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar" [style.width.%]="uploadProgress()"></div>
            <span class="progress-label">{{ uploadLabel() }} — {{ uploadProgress() }}%</span>
          </div>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </section>

      <section class="card rag-panel">
        <h2>Recherche documentaire (RAG)</h2>
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Ex. facture, contrat, client…"
            [ngModel]="ragQuery()"
            (ngModelChange)="ragQuery.set($event)"
            (keyup.enter)="runRagSearch()"
          />
          <button type="button" class="btn btn-primary" [disabled]="ragLoading() || !ragQuery().trim()" (click)="runRagSearch()">
            {{ ragLoading() ? 'Recherche…' : 'Chercher' }}
          </button>
        </div>
        @if (ragError()) {
          <p class="error" role="alert">{{ ragError() }}</p>
        }
        <ul class="rag-hits">
          @for (hit of ragHits(); track hit.chunkId) {
            <li>
              <strong>{{ hit.assetName }}</strong>
              <span class="score">score {{ hit.score }}</span>
              <p>{{ hit.excerpt }}</p>
            </li>
          } @empty {
            @if (ragSearched()) {
              <li class="empty">Aucun passage trouvé.</li>
            }
          }
        </ul>
      </section>

      <div class="toolbar">
        <input class="input search" placeholder="Rechercher…" [ngModel]="query()" (ngModelChange)="query.set($event)" />
        <select class="input" [ngModel]="filter()" (ngModelChange)="filter.set($event)">
          <option value="">Tous les types</option>
          <option value="PDF">PDF</option>
          <option value="CSV">CSV</option>
          <option value="XLSX">XLSX</option>
          <option value="JSON">JSON</option>
          <option value="TXT">TXT</option>
          <option value="DOCX">DOCX</option>
          <option value="IMAGE">IMAGE</option>
        </select>
      </div>

      <ul class="file-list">
        @for (asset of filtered(); track asset.id) {
          <li class="card file-item">
            <div>
              <strong>{{ asset.name }}</strong>
              <p class="meta">
                {{ asset.fileType }} · {{ formatSize(asset.sizeBytes) }} ·
                {{ asset.createdAt | date: 'short' }}
              </p>
              <p class="status">
                {{ asset.status }} — {{ processingLabel(asset.processingStatus) }}
              </p>
              @if (asset.storedAssetId) {
                <button type="button" class="download-link" (click)="download(asset)">
                  Télécharger
                </button>
              }
              <div class="form-group">
                <label class="label">Description</label>
                <input
                  class="input"
                  [ngModel]="asset.description || ''"
                  (ngModelChange)="descDraft[asset.id] = $event"
                  (blur)="saveDesc(asset.id)"
                />
              </div>
              <div class="form-group">
                <label class="label">Agents liés (ids séparés par virgule)</label>
                <input
                  class="input"
                  [ngModel]="asset.linkedAgentIds || ''"
                  (ngModelChange)="linkDraft[asset.id] = $event"
                  (blur)="saveLinks(asset.id)"
                />
              </div>
            </div>
            <button type="button" class="btn btn-danger" (click)="remove(asset.id)">Supprimer</button>
          </li>
        } @empty {
          <li class="empty">Aucun fichier importé.</li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .dropzone {
      padding: 2rem;
      text-align: center;
      border: 1px dashed var(--border-strong);
      margin-bottom: 1rem;
      transition: background var(--transition), border-color var(--transition);
    }
    .dropzone.active { background: color-mix(in srgb, var(--accent-primary) 10%, transparent); }
    .hint { font-size: 0.75rem; color: var(--text-muted); }
    .progress {
      margin: 1rem auto 0;
      max-width: 360px;
      height: 1.5rem;
      border-radius: 999px;
      background: var(--bg-muted, #e2e8f0);
      position: relative;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: var(--accent-primary);
      transition: width 0.15s ease;
    }
    .progress-label {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 0.7rem;
      color: var(--text-primary);
    }
    .error { color: var(--accent-danger); }
    .toolbar { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; }
    .file-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .file-item { display: flex; justify-content: space-between; gap: 1rem; padding: 1rem; align-items: flex-start; }
    .meta, .status { margin: 0.25rem 0; font-size: 0.78rem; color: var(--text-secondary); }
    .empty { color: var(--text-muted); padding: 1rem; }
    .form-group { margin-top: 0.55rem; max-width: 420px; }
    .download-link { font-size: 0.78rem; color: var(--accent-primary); background: none; border: none; padding: 0; cursor: pointer; text-decoration: underline; }
    .rag-panel { padding: 1rem; margin-bottom: 1rem; }
    .rag-panel h2 { margin: 0 0 0.75rem; font-size: 0.95rem; font-family: var(--font-display); }
    .rag-engine {
      display: inline-block;
      margin-left: 0.35rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .rag-hits { list-style: none; padding: 0; margin: 0.75rem 0 0; display: flex; flex-direction: column; gap: 0.65rem; }
    .rag-hits li { border-top: 1px solid var(--border-color); padding-top: 0.55rem; font-size: 0.82rem; }
    .rag-hits .score { margin-left: 0.5rem; color: var(--text-muted); font-size: 0.72rem; }
    .rag-hits p { margin: 0.25rem 0 0; color: var(--text-secondary); }
  `],
})
export class CompanyDataPage implements OnInit {
  readonly ws = inject(ProfessionalWorkspaceService);
  private readonly api = inject(ApiService);
  readonly accept = DATA_FILE_ACCEPT;
  readonly dragOver = signal(false);
  readonly error = signal('');
  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly uploadLabel = signal('');
  readonly query = signal('');
  readonly filter = signal('');
  readonly ragQuery = signal('');
  readonly ragHits = signal<Array<{
    chunkId: string;
    dataAssetId: string;
    assetName: string;
    chunkIndex: number;
    excerpt: string;
    score: number;
  }>>([]);
  readonly ragLoading = signal(false);
  readonly ragError = signal('');
  readonly ragSearched = signal(false);
  readonly ragChunks = signal(0);
  readonly ragEngineLabel = signal('');
  descDraft: Record<string, string> = {};
  linkDraft: Record<string, string> = {};

  async ngOnInit(): Promise<void> {
    await this.ws.hydrate();
    this.api.getRagStats().subscribe({
      next: (s) => {
        this.ragChunks.set(s.chunkCount);
        this.ragEngineLabel.set(formatRagEngineLabel(s));
      },
      error: () => {
        this.ragChunks.set(0);
        this.ragEngineLabel.set('');
      },
    });
  }

  async runRagSearch(): Promise<void> {
    const q = this.ragQuery().trim();
    if (!q) return;
    this.ragLoading.set(true);
    this.ragError.set('');
    this.ragSearched.set(true);
    try {
      const res = await firstValueFrom(this.api.searchRag(q));
      this.ragHits.set(res.hits);
      this.ragChunks.set(res.totalChunks);
    } catch (err) {
      this.ragError.set(mapHttpError(err, 'Recherche impossible'));
      this.ragHits.set([]);
    } finally {
      this.ragLoading.set(false);
    }
  }

  filtered() {
    const q = this.query().toLowerCase().trim();
    const f = this.filter();
    return this.ws.dataAssets().filter((a) => {
      if (f && a.fileType !== f) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver.set(false);
    const files = e.dataTransfer?.files;
    if (files?.length) void this.ingest(Array.from(files));
  }

  onFiles(e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    if (files?.length) void this.ingest(Array.from(files));
  }

  async ingest(files: File[]): Promise<void> {
    this.error.set('');
    for (const file of files) {
      if (file.size > DATA_MAX_BYTES) {
        this.error.set(`${file.name} dépasse 15 Mo.`);
        continue;
      }
      this.uploading.set(true);
      this.uploadProgress.set(0);
      this.uploadLabel.set(file.name);
      try {
        await new Promise<void>((resolve, reject) => {
          let settled = false;
          this.api.uploadCompanyDataAssetProgress(file, 'import').subscribe({
            next: (ev) => {
              this.uploadProgress.set(ev.progress);
              if (ev.done && !settled) {
                settled = true;
                void this.ws
                  .hydrate()
                  .then(() => resolve())
                  .catch(reject);
              }
            },
            error: (err) => {
              if (!settled) {
                settled = true;
                reject(err);
              }
            },
            complete: () => {
              if (!settled) {
                settled = true;
                void this.ws.hydrate().then(() => resolve()).catch(reject);
              }
            },
          });
        });
      } catch (err) {
        this.error.set(mapHttpError(err, `Échec import : ${file.name}`));
      } finally {
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.uploadLabel.set('');
      }
    }
  }

  processingLabel(status: string): string {
    if (status === 'INDEXED') return 'Indexé — disponible pour le RAG agents';
    if (status === 'UPLOADED') return 'Fichier stocké — formats texte/CSV/JSON indexables';
    if (status === 'PENDING_AI') return 'En attente de traitement IA (non disponible)';
    return status;
  }

  async download(asset: CompanyDataAsset): Promise<void> {
    if (!asset.storedAssetId) return;
    this.error.set('');
    try {
      const signed = await firstValueFrom(this.api.getStoredAssetSignedUrl(asset.storedAssetId));
      if (signed.supported && signed.url) {
        window.open(signed.url, '_blank', 'noopener');
        return;
      }
      const blob = await firstValueFrom(this.api.downloadStoredAsset(asset.storedAssetId));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = asset.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      this.error.set(mapHttpError(err, 'Téléchargement impossible'));
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  async saveDesc(id: string): Promise<void> {
    const description = this.descDraft[id];
    if (description === undefined) return;
    await this.ws.updateDataAsset(id, { description });
  }

  async saveLinks(id: string): Promise<void> {
    const linkedAgentIds = this.linkDraft[id];
    if (linkedAgentIds === undefined) return;
    await this.ws.updateDataAsset(id, { linkedAgentIds });
  }

  async remove(id: string): Promise<void> {
    if (!confirm('Supprimer ce fichier ?')) return;
    await this.ws.deleteDataAsset(id);
  }
}
