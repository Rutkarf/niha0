/** Définition métier d'une équipe : chef + 4 postes clés réels. */
export interface TeamRoleDefinition {
  rowId: number;
  /** Nom court de l'équipe (Accueil, Vente, …). */
  department: string;
  /** Intitulé du chef d'équipe sur la plateforme. */
  chiefTitle: string;
  /** 4 postes clés des membres, ordre du fond vers l'avant. */
  memberTitles: readonly [string, string, string, string];
}

export const TEAM_ROLE_DEFINITIONS: readonly TeamRoleDefinition[] = [
  {
    rowId: 1,
    department: 'Accueil',
    chiefTitle: 'Responsable Accueil & Réception',
    memberTitles: [
      'Hôte d\'accueil',
      'Standardiste',
      'Agent de réception',
      'Concierge',
    ],
  },
  {
    rowId: 2,
    department: 'Support',
    chiefTitle: 'Responsable Support Client',
    memberTitles: [
      'Technicien support N1',
      'Technicien support N2',
      'Spécialiste incidents',
      'Agent helpdesk',
    ],
  },
  {
    rowId: 3,
    department: 'Vente',
    chiefTitle: 'Directeur Commercial',
    memberTitles: [
      'Commercial terrain',
      'Account Manager',
      'Chargé de clientèle',
      'Business Developer',
    ],
  },
  {
    rowId: 4,
    department: 'RH',
    chiefTitle: 'Responsable Ressources Humaines',
    memberTitles: [
      'Chargé de recrutement',
      'Gestionnaire de paie',
      'Responsable formation',
      'Chargé relations sociales',
    ],
  },
  {
    rowId: 5,
    department: 'Finance',
    chiefTitle: 'Directeur Financier',
    memberTitles: [
      'Comptable général',
      'Contrôleur de gestion',
      'Trésorier',
      'Auditeur interne',
    ],
  },
  {
    rowId: 6,
    department: 'Marketing',
    chiefTitle: 'Directeur Marketing',
    memberTitles: [
      'Chargé de communication',
      'Community Manager',
      'Chef de produit marketing',
      'Traffic Manager',
    ],
  },
  {
    rowId: 7,
    department: 'Dev',
    chiefTitle: 'Lead Developer',
    memberTitles: [
      'Développeur frontend',
      'Développeur backend',
      'Ingénieur DevOps',
      'Architecte logiciel',
    ],
  },
  {
    rowId: 8,
    department: 'Design',
    chiefTitle: 'Directeur Artistique',
    memberTitles: [
      'UX Designer',
      'UI Designer',
      'Product Designer',
      'Motion Designer',
    ],
  },
  {
    rowId: 9,
    department: 'Ops',
    chiefTitle: 'Responsable Exploitation IT',
    memberTitles: [
      'Administrateur systèmes',
      'Ingénieur réseau',
      'Technicien infrastructure',
      'Gestionnaire de parc',
    ],
  },
  {
    rowId: 10,
    department: 'QA',
    chiefTitle: 'Responsable Qualité & Tests',
    memberTitles: [
      'Testeur fonctionnel',
      'Ingénieur QA automatisation',
      'QA Engineer',
      'Responsable recette',
    ],
  },
] as const;

export function teamDefinition(rowId: number): TeamRoleDefinition {
  return TEAM_ROLE_DEFINITIONS[rowId - 1] ?? TEAM_ROLE_DEFINITIONS[0]!;
}

export function departmentForRow(rowId: number): string {
  return teamDefinition(rowId).department;
}

export function chiefTitleForRow(rowId: number): string {
  return teamDefinition(rowId).chiefTitle;
}

export function memberTitleForRow(rowId: number, memberIndex: number): string {
  const team = teamDefinition(rowId);
  const idx = Math.max(0, Math.min(team.memberTitles.length - 1, memberIndex));
  return team.memberTitles[idx]!;
}

/** Vérifie 4 postes distincts et non vides par équipe. */
export function assertTeamMemberTitlesValid(): void {
  for (const team of TEAM_ROLE_DEFINITIONS) {
    expectNonEmpty(team.chiefTitle, `chef row ${team.rowId}`);
    const titles = new Set<string>();
    for (const title of team.memberTitles) {
      expectNonEmpty(title, `member row ${team.rowId}`);
      if (titles.has(title)) {
        throw new Error(`Duplicate member title "${title}" in team ${team.department}`);
      }
      titles.add(title);
    }
  }
}

function expectNonEmpty(value: string, ctx: string): void {
  if (!value?.trim()) throw new Error(`Empty title for ${ctx}`);
}

/** Liste à plat des 40 postes membres avec pôle. */
export function allMemberDeskLabels(): Array<{ rowId: number; department: string; title: string }> {
  return TEAM_ROLE_DEFINITIONS.flatMap((team) =>
    team.memberTitles.map((title, idx) => ({
      rowId: team.rowId,
      department: team.department,
      title,
      index: idx,
    })),
  );
}

/** Noms courts des 10 équipes (compatibilité API). */
export const KEY_POSITIONS = TEAM_ROLE_DEFINITIONS.map((t) => t.department);

export type KeyPosition = (typeof KEY_POSITIONS)[number];

export function keyPosition(rowId: number): string {
  return departmentForRow(rowId);
}
