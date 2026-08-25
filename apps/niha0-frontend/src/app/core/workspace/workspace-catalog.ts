/**
 * Single source of truth for workspace entities shared by
 * sidebar navigation, AI Office 3D scene, and consultation panels.
 */

export type WorkspaceStatus = 'available' | 'soon';

export interface WorkspaceEntity {
  id: string;
  label: string;
  status: WorkspaceStatus;
  icon: string;
  description: string;
  /** World position [x, y, z] for the 3D library prop. */
  position3D: [number, number, number];
  isAvailable: boolean;
  /** Module page route (if any). */
  route: string;
  /** Accent hex for 3D / UI. */
  accent: string;
  navGroup: 'data';
}

/** Futuristic data libraries — ligne horizontale au fond à gauche, le long du bureau CEO. */
export const DATA_LIBRARIES: readonly WorkspaceEntity[] = [
  {
    id: 'CMCMS',
    label: 'CMCMS',
    status: 'available',
    icon: 'CM',
    description: 'Gestion de contenu web et catalogues digitaux. CRUD opérationnel.',
    position3D: [-12.6, 0, -7.1],
    isAvailable: true,
    route: '/app/cms',
    accent: '#67E8F9',
    navGroup: 'data',
  },
  {
    id: 'PIPIM',
    label: 'PIPIM',
    status: 'available',
    icon: 'PI',
    description: 'Product Information Management — référentiel produits et variantes.',
    position3D: [-11.35, 0, -7.1],
    isAvailable: true,
    route: '/app/pim',
    accent: '#FB923C',
    navGroup: 'data',
  },
  {
    id: 'SCSC',
    label: 'SCSC',
    status: 'available',
    icon: 'SC',
    description: 'Supply Chain — achats et fournisseurs. CRUD opérationnel.',
    position3D: [-10.1, 0, -7.1],
    isAvailable: true,
    route: '/app/scm',
    accent: '#34D399',
    navGroup: 'data',
  },
  {
    id: 'MRMRP',
    label: 'MRMRP',
    status: 'available',
    icon: 'MR',
    description: 'Planification des besoins en matières (MRP). CRUD opérationnel.',
    position3D: [-8.85, 0, -7.1],
    isAvailable: true,
    route: '/app/mrp',
    accent: '#818CF8',
    navGroup: 'data',
  },
  {
    id: 'ETETL',
    label: 'ETETL',
    status: 'available',
    icon: 'ET',
    description: 'Extract, Transform, Load — intégration de données. CRUD opérationnel.',
    position3D: [-7.6, 0, -7.1],
    isAvailable: true,
    route: '/app/etl',
    accent: '#60A5FA',
    navGroup: 'data',
  },
  {
    id: 'EDEDI',
    label: 'EDEDI',
    status: 'available',
    icon: 'ED',
    description: 'Échanges de documents structurés B2B (EDI). CRUD opérationnel.',
    position3D: [-6.35, 0, -7.1],
    isAvailable: true,
    route: '/app/edi',
    accent: '#FBBF24',
    navGroup: 'data',
  },
] as const;

const BY_ID = new Map(DATA_LIBRARIES.map((e) => [e.id.toUpperCase(), e]));

export function getDataLibrary(id: string | null | undefined): WorkspaceEntity | undefined {
  if (!id) return undefined;
  return BY_ID.get(id.toUpperCase());
}

export function libraryIdFromQuery(q: string | null | undefined): string | null {
  const found = getDataLibrary(q);
  return found?.id ?? null;
}
