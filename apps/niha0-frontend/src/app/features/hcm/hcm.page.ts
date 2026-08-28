import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { Agent, Employee, LeaveRequest } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import {
  EMPLOYEE_STATUS_OPTIONS,
  LEAVE_STATUS_FILTER_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  statusLabel,
} from '../../shared/ui/status-labels';
import { mapHttpError } from '../../core/api/http-error.util';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-hcm-page',
  imports: [
    FormsModule,
    LoadingStateComponent,
    EmptyStateComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    StatusBadgeComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Gestion"
        title="RH / HCM"
        backLabel="← AI Office RH / HCM"
        [backQueryParams]="{ agent: 'rh' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="rh"
        sectionLabel="Agent dédié RH / HCM"
        officeLinkLabel="RH / HCM"
      />

      <div class="hcm-kpis">
        <div class="kpi-chip">
          <span class="kpi-val">{{ activeEmployees() }}</span>
          <span class="kpi-lbl">Actifs</span>
        </div>
        <div class="kpi-chip">
          <span class="kpi-val">{{ pendingLeaves() }}</span>
          <span class="kpi-lbl">Congés en attente</span>
        </div>
        <div class="kpi-chip">
          <span class="kpi-val">{{ approvedLeaves() }}</span>
          <span class="kpi-lbl">Congés approuvés</span>
        </div>
        <div class="kpi-chip">
          <span class="kpi-val">{{ departmentCount() }}</span>
          <span class="kpi-lbl">Départements</span>
        </div>
      </div>

      <div class="hcm-pair-row">
        <section class="feature-hub card hcm-half">
          <header class="feature-hub-head">
            <h2 class="feature-hub-title">{{ editingEmpId() ? 'Modifier le collaborateur' : 'Nouveau collaborateur' }}</h2>
            <span class="feature-hub-sub">Fiche employé · recrutement</span>
          </header>

          <form class="hcm-form" (ngSubmit)="saveEmployee()">
            <div class="embedded-form-grid">
              <label class="label">
                Prénom
                <input class="input" name="firstName" [(ngModel)]="firstName" required maxlength="120" />
              </label>
              <label class="label">
                Nom
                <input class="input" name="lastName" [(ngModel)]="lastName" required maxlength="120" />
              </label>
              <label class="label span-2">
                Email
                <input class="input" type="email" name="email" [(ngModel)]="email" maxlength="180" />
              </label>
              <label class="label">
                Poste
                <input class="input" name="jobTitle" [(ngModel)]="jobTitle" maxlength="160" />
              </label>
              <label class="label">
                Département
                <input class="input" name="department" [(ngModel)]="department" maxlength="120" list="dept-suggestions" />
                <datalist id="dept-suggestions">
                  @for (d of departmentSuggestions(); track d) {
                    <option [value]="d"></option>
                  }
                </datalist>
              </label>
              <label class="label">
                Statut
                <select class="input" name="empStatus" [(ngModel)]="empStatus">
                  @for (opt of employeeStatusOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
              <label class="label">
                Date d'embauche
                <input class="input" type="date" name="hiredAt" [(ngModel)]="hiredAt" />
              </label>
              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary" [disabled]="savingEmp() || !firstName.trim() || !lastName.trim()">
                  {{ savingEmp() ? '…' : editingEmpId() ? 'Mettre à jour' : 'Ajouter' }}
                </button>
                @if (editingEmpId()) {
                  <button type="button" class="btn btn-ghost" (click)="cancelEmpEdit()">Annuler</button>
                }
              </div>
            </div>
          </form>
        </section>

        <section class="feature-hub card hcm-half team-section">
          <header class="section-toolbar" role="toolbar" aria-label="Équipe">
            <h2 class="section-title">Équipe</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Nom, poste, département…"
                [ngModel]="empQuery()"
                (ngModelChange)="empQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Collaborateurs et postes</span>
              <span class="section-count">{{ employees().length }} collaborateur(s)</span>
            </div>
          </header>

          @if (loadingEmp()) {
            <app-skeleton message="Chargement de l'équipe…" [lines]="5" />
          } @else if (!employees().length) {
            <app-empty-state
              title="Aucun collaborateur"
              icon="RH"
              description="Ajoutez un collaborateur avec le formulaire à gauche."
            />
          } @else {
            @if (filteredEmployees().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head emp-cols" role="row">
                <span role="columnheader">Nom</span>
                <span role="columnheader">Poste</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                @for (e of filteredEmployees(); track e.id) {
                  <div class="feature-scroll-cols row emp-cols" role="row" [class.row-editing]="editingEmpId() === e.id">
                    <span class="feature-cell feature-cell-primary" role="cell" [title]="e.firstName + ' ' + e.lastName">
                      {{ e.firstName }} {{ e.lastName }}
                    </span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ e.jobTitle || e.department || '—' }}</span>
                    <span role="cell"><app-status-badge [status]="e.status" /></span>
                    <span class="feature-row-actions feature-col-actions" role="cell">
                      <button type="button" class="btn btn-ghost btn-sm" (click)="editEmployee(e)">Éditer</button>
                      <button type="button" class="btn btn-danger btn-sm" (click)="removeEmployee(e)">×</button>
                    </span>
                  </div>
                } @empty {
                  <p class="feature-empty-filter">Aucun résultat</p>
                }
              </div>
            </div>
          }
        </section>
      </div>

      <div class="hcm-pair-row">
        <section class="feature-hub card hcm-half">
          <header class="feature-hub-head">
            <h2 class="feature-hub-title">Nouvelle demande de congé</h2>
            <span class="feature-hub-sub">Absences et validations</span>
          </header>

          <form class="hcm-form" (ngSubmit)="saveLeave()">
            <div class="embedded-form-grid">
              <label class="label span-2">
                Collaborateur
                <select class="input" name="leaveEmployeeId" [(ngModel)]="leaveEmployeeId" required>
                  <option value="">— Sélectionner —</option>
                  @for (e of employees(); track e.id) {
                    <option [value]="e.id">{{ e.firstName }} {{ e.lastName }}</option>
                  }
                </select>
              </label>
              <label class="label">
                Type
                <select class="input" name="leaveType" [(ngModel)]="leaveType">
                  @for (opt of leaveTypeOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
              <label class="label">
                Durée
                <span class="duration-hint">{{ leaveDaysPreview() }} jour(s)</span>
              </label>
              <label class="label">
                Début
                <input class="input" type="date" name="leaveStart" [(ngModel)]="leaveStart" required />
              </label>
              <label class="label">
                Fin
                <input class="input" type="date" name="leaveEnd" [(ngModel)]="leaveEnd" required />
              </label>
              <label class="label span-2">
                Motif
                <textarea class="input" name="leaveReason" rows="2" [(ngModel)]="leaveReason" maxlength="2000"></textarea>
              </label>
              <div class="form-actions span-2">
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="savingLeave() || !leaveEmployeeId || !leaveStart || !leaveEnd"
                >
                  {{ savingLeave() ? '…' : 'Soumettre la demande' }}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section class="feature-hub card hcm-half leaves-section">
          <header class="section-toolbar leaves-toolbar" role="toolbar" aria-label="Congés">
            <h2 class="section-title">Congés</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Collaborateur, type…"
                [ngModel]="leaveQuery()"
                (ngModelChange)="leaveQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <select
                class="input filter-select toolbar-filter"
                [ngModel]="leaveStatusFilter()"
                (ngModelChange)="leaveStatusFilter.set($event)"
                aria-label="Filtrer par statut"
              >
                @for (opt of leaveStatusFilterOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
              <span class="section-tag">Demandes en attente et historique</span>
              <span class="section-count">{{ leaves().length }} demande(s)</span>
            </div>
          </header>

          @if (loadingLeaves()) {
            <app-skeleton message="Chargement des congés…" [lines]="5" />
          } @else if (!leaves().length) {
            <app-empty-state
              title="Aucune demande de congé"
              icon="LV"
              description="Soumettez une demande avec le formulaire à gauche."
            />
          } @else {
            @if (filteredLeaves().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head leave-cols" role="row">
                <span role="columnheader">Collaborateur</span>
                <span role="columnheader">Type</span>
                <span role="columnheader">Dates</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                @for (l of filteredLeaves(); track l.id) {
                  <div class="feature-scroll-cols row leave-cols" role="row">
                    <span class="feature-cell feature-cell-primary" role="cell">{{ employeeLabel(l.employeeId) }}</span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ leaveTypeLabel(l.leaveType) }}</span>
                    <span class="feature-cell feature-cell-muted" role="cell" [title]="l.reason || ''">
                      {{ l.startDate }} → {{ l.endDate }} · {{ l.days }}j
                      <app-status-badge [status]="l.status" />
                    </span>
                    <span class="feature-row-actions feature-col-actions" role="cell">
                      @if (l.status === 'PENDING') {
                        <button type="button" class="btn btn-primary btn-sm" (click)="decide(l, 'APPROVED')">✓</button>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="decide(l, 'REJECTED')">✗</button>
                        <button type="button" class="btn btn-danger btn-sm" (click)="removeLeave(l)">×</button>
                      } @else {
                        <span class="status-done">{{ statusLabel(l.status) }}</span>
                      }
                    </span>
                  </div>
                } @empty {
                  <p class="feature-empty-filter">Aucun résultat</p>
                }
              </div>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .hcm-kpis {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .kpi-chip {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      padding: var(--dash-inline-gap) var(--dash-band-gap);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
    }

    .kpi-val {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: var(--fw-bold);
      font-variant-numeric: tabular-nums;
      color: var(--accent-primary);
    }

    .kpi-lbl {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .hcm-pair-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap, var(--space-3));
      align-items: stretch;
    }

    .hcm-half {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .hcm-half .feature-hub-head {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
    }

    .section-toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
    }

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

    .team-section,
    .leaves-section {
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .table-hint { margin: 0; }

    .leaves-toolbar {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      min-width: 0;
    }

    .leaves-toolbar .section-title {
      flex: 0 0 auto;
    }

    .leaves-toolbar .section-search {
      flex: 1 1 auto;
      min-width: 0;
      max-width: none;
      justify-self: unset;
    }

    .leaves-toolbar .section-toolbar-end {
      flex: 0 1 auto;
      min-width: 0;
      justify-self: unset;
    }

    .leaves-toolbar .section-tag {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 11rem;
    }

    .toolbar-filter {
      min-width: 7rem;
      max-width: 9rem;
      font-size: 0.72rem;
      padding: 0.25rem 0.4rem;
    }

    .embedded-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap);
      align-items: end;
    }

    .span-2 { grid-column: 1 / -1; }
    .label {
      margin-bottom: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.8rem;
    }

    .duration-hint {
      display: block;
      padding: 0.45rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-secondary);
      font-size: 0.85rem;
      font-weight: var(--fw-semibold);
      color: var(--text-primary);
    }

    .form-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap);
      padding-top: var(--dash-inline-gap);
      border-top: 1px solid var(--border-color);
    }

    .emp-cols {
      grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) 88px minmax(100px, auto);
    }

    .leave-cols {
      grid-template-columns: minmax(0, 1.1fr) 80px minmax(0, 1.4fr) minmax(100px, auto);
    }

    .leave-cols .feature-cell-muted {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
    }

    .row-editing {
      background: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-elevated));
      box-shadow: inset 3px 0 0 var(--accent-primary);
    }

    .filter-select { width: auto; min-width: 130px; font-size: 0.78rem; padding: 0.35rem 0.5rem; }
    .status-done { font-size: 0.68rem; color: var(--text-muted); font-weight: var(--fw-semibold); }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.45rem; min-height: auto; }

    @media (max-width: 960px) {
      .hcm-pair-row { grid-template-columns: 1fr; }
      .embedded-form-grid { grid-template-columns: 1fr; }
      .section-toolbar {
        grid-template-columns: 1fr;
        gap: var(--dash-inline-gap);
      }
      .section-search { max-width: none; justify-self: stretch; }
      .section-toolbar-end { justify-self: start; flex-wrap: wrap; }
      .leaves-toolbar { flex-wrap: wrap; }
      .leaves-toolbar .section-search { flex: 1 1 100%; order: 2; }
      .leaves-toolbar .section-title { order: 1; }
      .leaves-toolbar .section-toolbar-end { order: 3; flex: 1 1 100%; justify-content: flex-start; }
    }
`],
})
export class HcmPage implements OnInit {
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;
  readonly employeeStatusOptions = EMPLOYEE_STATUS_OPTIONS;
  readonly leaveTypeOptions = LEAVE_TYPE_OPTIONS;
  readonly leaveStatusFilterOptions = LEAVE_STATUS_FILTER_OPTIONS;
  readonly statusLabel = statusLabel;

  private readonly api = inject(ApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly loadingAgent = signal(true);
  readonly loadingEmp = signal(true);
  readonly loadingLeaves = signal(true);
  readonly savingEmp = signal(false);
  readonly savingLeave = signal(false);
  readonly agent = signal<Agent | null>(null);
  readonly employees = signal<Employee[]>([]);
  readonly leaves = signal<LeaveRequest[]>([]);
  readonly editingEmpId = signal<string | null>(null);
  readonly empQuery = signal('');
  readonly leaveQuery = signal('');
  readonly leaveStatusFilter = signal('');

  firstName = '';
  lastName = '';
  email = '';
  jobTitle = '';
  department = '';
  empStatus = 'ACTIVE';
  hiredAt = '';

  leaveEmployeeId = '';
  leaveType = 'ANNUAL';
  leaveStart = '';
  leaveEnd = '';
  leaveReason = '';

  readonly activeEmployees = computed(() => this.employees().filter((e) => e.status === 'ACTIVE').length);
  readonly pendingLeaves = computed(() => this.leaves().filter((l) => l.status === 'PENDING').length);
  readonly approvedLeaves = computed(() => this.leaves().filter((l) => l.status === 'APPROVED').length);
  readonly departmentCount = computed(() => {
    const depts = new Set(this.employees().map((e) => e.department?.trim()).filter(Boolean));
    return depts.size;
  });

  readonly departmentSuggestions = computed(() => {
    const depts = new Set(this.employees().map((e) => e.department?.trim()).filter(Boolean) as string[]);
    return [...depts].sort();
  });

  readonly filteredEmployees = computed(() => {
    const q = this.empQuery().trim().toLowerCase();
    const list = this.employees();
    if (!q) return list;
    return list.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        (e.email ?? '').toLowerCase().includes(q) ||
        (e.jobTitle ?? '').toLowerCase().includes(q) ||
        (e.department ?? '').toLowerCase().includes(q) ||
        (e.status ?? '').toLowerCase().includes(q),
    );
  });

  readonly filteredLeaves = computed(() => {
    const q = this.leaveQuery().trim().toLowerCase();
    const status = this.leaveStatusFilter();
    let list = this.leaves();
    if (status) list = list.filter((l) => l.status === status);
    if (!q) return list;
    return list.filter((l) => {
      const name = this.employeeLabel(l.employeeId).toLowerCase();
      return (
        name.includes(q) ||
        (l.leaveType ?? '').toLowerCase().includes(q) ||
        (l.status ?? '').toLowerCase().includes(q) ||
        (l.reason ?? '').toLowerCase().includes(q)
      );
    });
  });

  readonly leaveDaysPreview = computed(() => {
    const start = this.leaveStart;
    const end = this.leaveEnd;
    if (!start || !end) return 0;
    const a = new Date(start);
    const b = new Date(end);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
    return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'RH') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  employeeLabel(id: string): string {
    const e = this.employees().find((x) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id.slice(0, 8);
  }

  leaveTypeLabel(type: string): string {
    return this.leaveTypeOptions.find((o) => o.value === type)?.label ?? statusLabel(type);
  }

  editEmployee(e: Employee): void {
    this.editingEmpId.set(e.id);
    this.firstName = e.firstName;
    this.lastName = e.lastName;
    this.email = e.email ?? '';
    this.jobTitle = e.jobTitle ?? '';
    this.department = e.department ?? '';
    this.empStatus = e.status || 'ACTIVE';
    this.hiredAt = e.hiredAt?.slice(0, 10) ?? '';
  }

  cancelEmpEdit(): void {
    this.editingEmpId.set(null);
    this.resetEmpForm();
  }

  saveEmployee(): void {
    if (!this.firstName.trim() || !this.lastName.trim()) return;
    this.savingEmp.set(true);
    const body: Partial<Employee> = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      jobTitle: this.jobTitle.trim(),
      department: this.department.trim(),
      status: this.empStatus,
      hiredAt: this.hiredAt || undefined,
    };
    const id = this.editingEmpId();
    const req = id ? this.api.updateEmployee(id, body) : this.api.createEmployee(body);
    req.subscribe({
      next: () => {
        this.savingEmp.set(false);
        this.toast.success(id ? 'Collaborateur mis à jour.' : 'Collaborateur ajouté.');
        this.cancelEmpEdit();
        this.reload();
      },
      error: (err) => {
        this.savingEmp.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }

  async removeEmployee(e: Employee): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer le collaborateur',
      message: `Supprimer ${e.firstName} ${e.lastName} ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteEmployee(e.id).subscribe({
      next: () => {
        this.toast.success('Collaborateur supprimé.');
        if (this.editingEmpId() === e.id) this.cancelEmpEdit();
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  saveLeave(): void {
    if (!this.leaveEmployeeId || !this.leaveStart || !this.leaveEnd) return;
    if (this.leaveDaysPreview() < 1) {
      this.toast.error('La date de fin doit être après la date de début.');
      return;
    }
    this.savingLeave.set(true);
    this.api
      .createLeave({
        employeeId: this.leaveEmployeeId,
        leaveType: this.leaveType,
        startDate: this.leaveStart,
        endDate: this.leaveEnd,
        reason: this.leaveReason.trim(),
        status: 'PENDING',
      })
      .subscribe({
        next: () => {
          this.savingLeave.set(false);
          this.toast.success('Demande de congé soumise.');
          this.leaveEmployeeId = '';
          this.leaveType = 'ANNUAL';
          this.leaveStart = '';
          this.leaveEnd = '';
          this.leaveReason = '';
          this.reload();
        },
        error: (err) => {
          this.savingLeave.set(false);
          this.toast.error(mapHttpError(err));
        },
      });
  }

  decide(l: LeaveRequest, status: string): void {
    this.api.decideLeave(l.id, status).subscribe({
      next: () => {
        this.toast.success(status === 'APPROVED' ? 'Congé approuvé.' : 'Congé refusé.');
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  async removeLeave(l: LeaveRequest): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer la demande',
      message: `Supprimer la demande de congé de ${this.employeeLabel(l.employeeId)} ?`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteLeave(l.id).subscribe({
      next: () => {
        this.toast.success('Demande supprimée.');
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  private resetEmpForm(): void {
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.jobTitle = '';
    this.department = '';
    this.empStatus = 'ACTIVE';
    this.hiredAt = '';
  }

  private reload(): void {
    this.loadingEmp.set(true);
    this.loadingLeaves.set(true);
    this.api.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loadingEmp.set(false);
      },
      error: () => this.loadingEmp.set(false),
    });
    this.api.getLeaves().subscribe({
      next: (data) => {
        this.leaves.set(data);
        this.loadingLeaves.set(false);
      },
      error: () => this.loadingLeaves.set(false),
    });
  }
}
