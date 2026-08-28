import { describe, expect, it } from 'vitest';
import { CEO_POS, DESK_BY_CODE, TOTEM_ANIMALS } from './layout';
import { BACK_WALL_Z, buildNihaoOfficeLayout, CHIEF_PLATFORM, isChiefOnPlatform, isTeamColumnAligned, LAYOUT_SKEW_DEG, memberDeskSpacing, NIHAO_ROW_LAYOUTS, resolveRowDeskCode, teamColumnSpacing } from '../config/row-layout';
import { isInsideOpenSpaceCarpet, openSpaceCarpetBounds } from '../config/open-space-carpet';
import { ROW_COLORS } from '../config/colors';
import { TEAM_COLORS, deskAccentForColumn } from '../config/team-colors';
import { KEY_POSITIONS } from '../config/roles';
import { buildNihaoLedLayout, ledModeForAgentStatus } from '../config/agent-desk-led';
import { TEAM_ROLE_DEFINITIONS, memberTitleForRow, chiefTitleForRow, assertTeamMemberTitlesValid, allMemberDeskLabels } from '../config/team-roles';
import { createLedPair, setLedMode } from './led.factory';
import { createTotemAnimal } from './totem.factory';
import { createAgentRowDesks, createChiefDesk, isChiefDeskFacingRow } from './agent-row.factory';
import { createChiefPlatform } from './row-platform.factory';
import { DATA_LIBRARIES } from '../../../core/workspace/workspace-catalog';
import { getPalette } from './theme-palette';

describe('AI Office spatial v2', () => {
  it('keeps CEO and data libraries at their original anchors', () => {
    expect(CEO_POS.x).toBe(-10);
    expect(CEO_POS.z).toBe(0);
    expect(DATA_LIBRARIES[0]!.position3D[0]).toBe(-12.6);
    expect(DATA_LIBRARIES[0]!.position3D[2]).toBe(-7.1);
  });

  it('keeps all 11 existing desks in a 7+4 layout', () => {
    const codes = Object.keys(DESK_BY_CODE);
    expect(codes).toHaveLength(11);
    const rowCounts = new Map<number, number>();
    for (const [, z] of Object.values(DESK_BY_CODE)) {
      rowCounts.set(z, (rowCounts.get(z) ?? 0) + 1);
    }
    expect(rowCounts.size).toBe(2);
    expect([...rowCounts.values()].sort((a, b) => a - b)).toEqual([4, 7]);
  });

  it('defines 7 totem animals', () => {
    expect(TOTEM_ANIMALS).toHaveLength(7);
    const kinds = TOTEM_ANIMALS.map((a) => a.kind);
    expect(kinds).toEqual(['eagle', 'wolf', 'fox', 'tiger', 'owl', 'dragon', 'butterfly']);
  });

  it('creates LED pairs and totem groups', () => {
    const leds = createLedPair('test');
    expect(leds.userData['type']).toBe('leds');
    setLedMode(leds, 'green');
    expect(leds.userData['mode']).toBe('green');

    const eagle = createTotemAnimal(TOTEM_ANIMALS[0]!);
    expect(eagle.userData['type']).toBe('totem');
    expect(eagle.userData['totemKind']).toBe('eagle');
  });

  it('defines 10 straight team columns with chiefs on back wall platform', () => {
    const layout = buildNihaoOfficeLayout();
    const carpet = openSpaceCarpetBounds();
    expect(NIHAO_ROW_LAYOUTS).toHaveLength(10);
    expect(layout.agentCount).toBe(40);
    expect(layout.chiefCount).toBe(10);
    expect(LAYOUT_SKEW_DEG).toBe(0);
    expect(CHIEF_PLATFORM.tiltDeg).toBe(0);
    expect(teamColumnSpacing()).toBeGreaterThan(1.8);
    expect(memberDeskSpacing()).toBeGreaterThan(3.5);
    expect(ROW_COLORS).toHaveLength(10);
    expect(KEY_POSITIONS).toHaveLength(10);

    const platformBackZ = CHIEF_PLATFORM.z - CHIEF_PLATFORM.depth / 2;
    expect(platformBackZ).toBeGreaterThanOrEqual(BACK_WALL_Z);
    expect(platformBackZ).toBeLessThan(BACK_WALL_Z + 0.2);

    for (const row of NIHAO_ROW_LAYOUTS) {
      expect(row.agents).toHaveLength(4);
      expect(row.color).toBe(ROW_COLORS[row.rowId - 1]);
      expect(row.role).toBe(KEY_POSITIONS[row.rowId - 1]);
      expect(row.chief.y).toBeGreaterThan(0);
      expect(row.chief.z).toBeLessThan(carpet.minZ);
      expect(isChiefOnPlatform(row.chief.x, row.chief.z)).toBe(true);
      expect(isTeamColumnAligned(row)).toBe(true);

      const teamX = row.chief.x;
      for (const agent of row.agents) {
        expect(agent.x).toBeCloseTo(teamX, 5);
        expect(agent.z).toBeGreaterThan(row.chief.z);
        expect(isInsideOpenSpaceCarpet(agent.x, agent.z)).toBe(true);
        expect(agent.x).toBeGreaterThanOrEqual(carpet.minX);
        expect(agent.x).toBeLessThanOrEqual(carpet.maxX);
        expect(agent.z).toBeGreaterThanOrEqual(carpet.minZ);
        expect(agent.z).toBeLessThanOrEqual(carpet.maxZ);
        expect(agent.y).toBe(0);
      }
    }
  });

  it('defines legacy desk coordinates outside Nihao carpet (not rendered in 3D)', () => {
    for (const [code, [x, z]] of Object.entries(DESK_BY_CODE)) {
      expect(isInsideOpenSpaceCarpet(x, z), `${code} overlaps Nihao carpet`).toBe(false);
    }
  });

  it('keeps exactly 40 Nihao desks inside the green carpet', () => {
    const carpet = openSpaceCarpetBounds();
    let count = 0;
    for (const row of NIHAO_ROW_LAYOUTS) {
      for (const agent of row.agents) {
        expect(isInsideOpenSpaceCarpet(agent.x, agent.z)).toBe(true);
        expect(agent.x).toBeGreaterThanOrEqual(carpet.minX);
        expect(agent.x).toBeLessThanOrEqual(carpet.maxX);
        count += 1;
      }
    }
    expect(count).toBe(40);
  });

  it('builds row agent desks and chief platform meshes', () => {
    const palette = getPalette('SOLARPUNK');
    const row = NIHAO_ROW_LAYOUTS[2]!;
    const agents = createAgentRowDesks(row, palette);
    expect(agents).toHaveLength(4);
    expect(agents[0]!.desk.userData['rowId']).toBe(3);
    expect(agents[0]!.clickZone.userData['rowDeskId']).toBe('R3A1');
    expect(agents[0]!.focusRing).toBeTruthy();

    const chief = createChiefDesk(row, palette);
    expect(chief.group.userData['scenicId']).toBe('CHIEF-R3');
    expect(isChiefDeskFacingRow(row, chief.desk)).toBe(true);

    const platform = createChiefPlatform(palette, 'SOLARPUNK');
    expect(platform.userData['type']).toBe('chief-platform');
  });

  it('orients all chief desks toward their member column', () => {
    const palette = getPalette('SOLARPUNK');
    for (const row of NIHAO_ROW_LAYOUTS) {
      const chief = createChiefDesk(row, palette);
      expect(isChiefDeskFacingRow(row, chief.desk)).toBe(true);
    }
  });

  it('seats row avatars on desk chair local position', () => {
    const palette = getPalette('SOLARPUNK');
    const row = NIHAO_ROW_LAYOUTS[0]!;
    const agents = createAgentRowDesks(row, palette);
    expect(agents[0]!.avatar.parent).toBe(agents[0]!.desk);
    expect(agents[0]!.avatar.position.z).toBeCloseTo(0.72, 2);
  });

  it('assigns a distinct job title to every one of the 40 member desks', () => {
    assertTeamMemberTitlesValid();
    const labels = allMemberDeskLabels();
    expect(labels).toHaveLength(40);
    for (const { rowId, department, title } of labels) {
      expect(title.trim().length).toBeGreaterThan(2);
      expect(department.trim().length).toBeGreaterThan(1);
      const row = NIHAO_ROW_LAYOUTS[rowId - 1]!;
      expect(row.role).toBe(department);
    }
  });

  it('assigns real job titles to chiefs and team members', () => {
    assertTeamMemberTitlesValid();
    expect(allMemberDeskLabels()).toHaveLength(40);
    for (const def of TEAM_ROLE_DEFINITIONS) {
      const row = NIHAO_ROW_LAYOUTS[def.rowId - 1]!;
      expect(row.role).toBe(def.department);
      expect(row.chiefTitle).toBe(def.chiefTitle);
      expect(row.chief.title).toBe(def.chiefTitle);
      expect(row.agents).toHaveLength(4);
      row.agents.forEach((agent, idx) => {
        expect(agent.title).toBe(def.memberTitles[idx]);
        expect(agent.title).toBe(memberTitleForRow(def.rowId, idx));
      });
    }
    expect(chiefTitleForRow(3)).toBe('Directeur Commercial');
    expect(memberTitleForRow(4, 0)).toBe('Chargé de recrutement');
  });

  it('renders desk labels with job title on each Nihao member desk', () => {
    const palette = getPalette('SOLARPUNK');
    const agents = createAgentRowDesks(NIHAO_ROW_LAYOUTS[1]!, palette);
    expect(agents).toHaveLength(4);
    for (const agent of agents) {
      expect(agent.label.trim().length).toBeGreaterThan(2);
      expect(agent.desk.userData['jobTitle']).toBe(agent.label);
      expect(agent.desk.userData['department']).toBe('Support');
      expect(agent.desk.userData['label']).toBe(agent.label);
      expect(agent.avatar.userData['jobTitle']).toBe(agent.label);
      if (agent.hoverLabel) expect(agent.hoverLabel.visible).toBe(false);
    }
  });

  it('drives LEDs: green autonomous, red when human approval needed', () => {
    expect(ledModeForAgentStatus('AVAILABLE')).toBe('green');
    expect(ledModeForAgentStatus('EXECUTING')).toBe('green');
    expect(ledModeForAgentStatus('WAITING_APPROVAL')).toBe('red');
    expect(ledModeForAgentStatus('AVAILABLE', true)).toBe('red');

    const layout = buildNihaoLedLayout({
      agents: [{ id: 'a1', code: 'SUPPORT', status: 'WAITING_APPROVAL' }],
      pendingAgentIds: new Set(['a1']),
    });
    expect(layout.rowDesks.get('R2A1')).toBe('red');
    expect(layout.rowDesks.get('R2A2')).toBe('green');
    expect(layout.chiefs.get(2)).toBe('red');
    expect(layout.chiefs.get(3)).toBe('green');
    expect(layout.scenic.get('ceo-protocol')).toBe('red');
  });

  it('resolves internal desk codes to job titles (never show R1A1 to users)', () => {
    expect(resolveRowDeskCode('R1A1')).toEqual({
      rowId: 1,
      deskIndex: 0,
      title: 'Hôte d\'accueil',
      pole: 'Accueil',
    });
    expect(resolveRowDeskCode('R2A3')?.title).toBe('Spécialiste incidents');
    expect(resolveRowDeskCode('CHIEF-R1')).toBeNull();
  });

  it('uses team color for all desks in a column', () => {
    const team = TEAM_COLORS[2]!;
    expect(team.role).toBe('Vente');
    expect(deskAccentForColumn(3, 0)).toBe(team.color);
    expect(deskAccentForColumn(3, 3)).toBe(team.color);
  });
});
