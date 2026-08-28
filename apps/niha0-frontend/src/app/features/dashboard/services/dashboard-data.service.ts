import { Injectable, computed, inject } from '@angular/core';
import { NIHAO_ROW_LAYOUTS, rowDeskCode } from '../../ai-office/config/row-layout';
import { teamForRow } from '../../ai-office/config/team-colors';
import { chiefTitleForRow, departmentForRow, memberTitleForRow } from '../../ai-office/config/team-roles';
import {
  buildNihaoLedLayout,
  type NihaoLedSnapshot,
} from '../../ai-office/config/agent-desk-led';
import { AgentStatusService } from '../../../core/navigation/agent-status.service';
import type {
  DashboardAgent,
  DashboardNihaoStats,
  DashboardTeam,
  LedDisplayStatus,
} from '../models/dashboard.models';

function hashSeed(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function mockFromSeed(seed: number, min: number, max: number): number {
  return min + (seed % (max - min + 1));
}

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly agentStatus = inject(AgentStatusService);

  private readonly ledLayout = computed(() => {
    const agents = this.agentStatus.agents();
    const pending = this.agentStatus.pendingActions();
    const pendingIds = new Set(pending.map((a) => a.agentId));
    const snapshot: NihaoLedSnapshot = {
      agents: agents.map((a) => ({ id: a.id, code: a.code, status: a.status })),
      pendingAgentIds: pendingIds,
    };
    return buildNihaoLedLayout(snapshot);
  });

  readonly agents = computed(() => this.buildAgents());
  readonly teams = computed(() => this.buildTeams());
  readonly chiefs = computed(() => this.agents().filter((a) => a.isChief));
  readonly members = computed(() => this.agents().filter((a) => !a.isChief));

  readonly stats = computed((): DashboardNihaoStats => {
    const list = this.agents();
    const green = list.filter((a) => a.ledStatus === 'green').length;
    const red = list.filter((a) => a.ledStatus === 'red').length;
    const active = green;
    return {
      totalAgents: list.length,
      activeAgents: active,
      inactiveAgents: red + list.filter((a) => a.ledStatus === 'off').length,
      totalTeams: this.teams().length,
      tasksInProgress: list.reduce((s, a) => s + a.tasksInProgress, 0),
      globalPerformance: Math.round(
        list.reduce((s, a) => s + a.performance, 0) / Math.max(1, list.length),
      ),
      greenLeds: green,
      redLeds: red,
    };
  });

  agentByDesk(deskCode: string): DashboardAgent | undefined {
    return this.agents().find((a) => a.deskCode === deskCode);
  }

  teamByRow(rowId: number): DashboardTeam | undefined {
    return this.teams().find((t) => t.rowId === rowId);
  }

  private buildAgents(): DashboardAgent[] {
    const layout = this.ledLayout();
    const out: DashboardAgent[] = [];

    for (const row of NIHAO_ROW_LAYOUTS) {
      const team = departmentForRow(row.rowId);
      const color = teamForRow(row.rowId).color;

      row.agents.forEach((_, col) => {
        const deskCode = rowDeskCode(row.rowId, col);
        const role = memberTitleForRow(row.rowId, col);
        const seed = hashSeed(deskCode);
        const led = layout.rowDesks.get(deskCode) ?? 'green';
        out.push(this.makeAgent({
          deskCode,
          name: `${role}`,
          role,
          team,
          rowId: row.rowId,
          teamColor: color,
          isChief: false,
          ledStatus: led as LedDisplayStatus,
          seed,
        }));
      });

      const chiefDesk = `R${row.rowId}C`;
      const chiefRole = chiefTitleForRow(row.rowId);
      const chiefSeed = hashSeed(chiefDesk);
      const chiefLed = layout.chiefs.get(row.rowId) ?? 'green';
      out.push(this.makeAgent({
        deskCode: chiefDesk,
        name: chiefRole,
        role: chiefRole,
        team,
        rowId: row.rowId,
        teamColor: color,
        isChief: true,
        ledStatus: chiefLed as LedDisplayStatus,
        seed: chiefSeed,
      }));
    }

    return out;
  }

  private buildTeams(): DashboardTeam[] {
    const all = this.agents();
    return NIHAO_ROW_LAYOUTS.map((row) => {
      const tc = teamForRow(row.rowId);
      const members = all.filter((a) => a.rowId === row.rowId && !a.isChief);
      const chief = all.find((a) => a.rowId === row.rowId && a.isChief)!;
      const activeCount = members.filter((m) => m.ledStatus === 'green').length;
      const tasksInProgress = members.reduce((s, m) => s + m.tasksInProgress, 0);
      const tasksCompleted = members.reduce((s, m) => s + m.tasksCompleted, 0);
      const performance = Math.round(
        members.reduce((s, m) => s + m.performance, 0) / Math.max(1, members.length),
      );
      return {
        rowId: row.rowId,
        name: departmentForRow(row.rowId),
        color: tc.color,
        gradient: tc.gradient,
        chiefName: chief.name,
        chiefTitle: chief.role,
        chiefDeskCode: chief.deskCode,
        agentCount: members.length,
        activeCount,
        tasksInProgress,
        tasksCompleted,
        performance,
        avgResponseMin: mockFromSeed(hashSeed(`team-${row.rowId}`), 4, 45),
        members,
        chief,
      };
    });
  }

  private makeAgent(input: {
    deskCode: string;
    name: string;
    role: string;
    team: string;
    rowId: number;
    teamColor: string;
    isChief: boolean;
    ledStatus: LedDisplayStatus;
    seed: number;
  }): DashboardAgent {
    const slug = input.deskCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      id: input.deskCode,
      deskCode: input.deskCode,
      name: input.name,
      role: input.role,
      team: input.team,
      rowId: input.rowId,
      teamColor: input.teamColor,
      isChief: input.isChief,
      ledStatus: input.ledStatus,
      email: `${slug}@nihao.local`,
      tasksInProgress: mockFromSeed(input.seed, 0, input.isChief ? 6 : 4),
      tasksCompleted: mockFromSeed(input.seed + 7, 12, 120),
      performance: mockFromSeed(input.seed + 13, 62, 98),
      lastAction: input.ledStatus === 'red' ? 'En attente validation humaine' : 'Traitement autonome en cours',
      history: [
        `Assignation tâche #${mockFromSeed(input.seed, 100, 999)}`,
        `Rapport équipe ${input.team} généré`,
        input.isChief ? 'Revue KPIs hebdomadaire' : 'Mise à jour fiche agent',
      ],
    };
  }
}
