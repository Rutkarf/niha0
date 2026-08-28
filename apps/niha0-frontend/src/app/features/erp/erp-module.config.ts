import { DATA_LIBRARIES } from '../../core/workspace/workspace-catalog';

export interface ErpFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  span?: 2;
  placeholder?: string;
  maxlength?: number;
  required?: boolean;
  options?: readonly { value: string; label: string }[];
  /** Affiché en sous-titre dans la liste */
  listHint?: boolean;
}

export interface ErpModuleConfig {
  module: string;
  title: string;
  callout: string;
  formTitle: string;
  formSubtitle: string;
  listTitle: string;
  listSubtitle: string;
  /** Libellé affiché à droite dans la barre liste (ex. « Pages et contenus web ») */
  listToolbarTag?: string;
  /** ID bibliothèque 3D (menu Données) */
  libraryId?: string;
  /** Couleur accent UI */
  accent?: string;
  codeLabel: string;
  codePlaceholder: string;
  titleLabel: string;
  titlePlaceholder: string;
  emptyIcon: string;
  emptyTitle: string;
  emptyDescription: string;
  statusOptions: readonly { value: string; label: string }[];
  defaultStatus: string;
  fields: ErpFieldConfig[];
  agentCode: string;
  officeQuery: string;
  /** Statuts considérés « actifs » pour le KPI */
  activeStatuses: string[];
  /** Statuts considérés « en attente » pour le KPI */
  pendingStatuses: string[];
  kpiActiveLabel: string;
  kpiPendingLabel: string;
}

export const ERP_MODULE_CONFIGS: Record<string, ErpModuleConfig> = {
  CMS: {
    module: 'CMS',
    title: 'CMS',
    callout: 'Gestion éditoriale : brouillons, publication et SEO. La mise en ligne reste soumise à validation.',
    formTitle: 'Nouvelle page',
    formSubtitle: 'Contenu web et référencement',
    listTitle: 'Pages',
    listSubtitle: 'Catalogue éditorial',
    listToolbarTag: 'Pages et contenus web',
    codeLabel: 'Slug URL',
    codePlaceholder: 'ex. accueil',
    titleLabel: 'Titre de page',
    titlePlaceholder: 'Page d\'accueil',
    emptyIcon: 'CM',
    emptyTitle: 'Aucune page',
    emptyDescription: 'Créez une page avec le formulaire à gauche.',
    statusOptions: [
      { value: 'DRAFT', label: 'Brouillon' },
      { value: 'PUBLISHED', label: 'Publiée' },
      { value: 'ARCHIVED', label: 'Archivée' },
    ],
    defaultStatus: 'DRAFT',
    fields: [
      {
        key: 'locale',
        label: 'Langue',
        type: 'select',
        options: [
          { value: 'fr', label: 'Français' },
          { value: 'en', label: 'Anglais' },
          { value: 'de', label: 'Allemand' },
        ],
      },
      {
        key: 'publishAt',
        label: 'Publication planifiée',
        type: 'date',
      },
      {
        key: 'seoDescription',
        label: 'Meta description (SEO)',
        type: 'text',
        span: 2,
        maxlength: 320,
        placeholder: 'Résumé pour les moteurs de recherche',
        listHint: true,
      },
      {
        key: 'content',
        label: 'Contenu',
        type: 'textarea',
        span: 2,
        placeholder: 'Corps de la page (HTML ou markdown)',
      },
    ],
    agentCode: 'MARKETING',
    officeQuery: 'cms',
    activeStatuses: ['PUBLISHED'],
    pendingStatuses: ['DRAFT'],
    kpiActiveLabel: 'Publiées',
    kpiPendingLabel: 'Brouillons',
  },
  SCM: {
    module: 'SCM',
    title: 'SCM',
    callout: 'Achats et supply chain. Les commandes critiques passent par recommandation agent et validation direction.',
    formTitle: 'Nouvelle commande',
    formSubtitle: 'Fournisseur et livraison',
    listTitle: 'Commandes fournisseurs',
    listSubtitle: 'Suivi achats',
    listToolbarTag: 'SupplyChain — Expéditions & fournisseur',
    codeLabel: 'Référence PO',
    codePlaceholder: 'PO-2026-001',
    titleLabel: 'Libellé',
    titlePlaceholder: 'Réappro composants',
    emptyIcon: 'SC',
    emptyTitle: 'Aucune commande',
    emptyDescription: 'Créez une commande fournisseur à gauche.',
    statusOptions: [
      { value: 'ORDERED', label: 'Commandée' },
      { value: 'IN_TRANSIT', label: 'En transit' },
      { value: 'RECEIVED', label: 'Réceptionnée' },
      { value: 'CANCELLED', label: 'Annulée' },
    ],
    defaultStatus: 'ORDERED',
    fields: [
      {
        key: 'supplier',
        label: 'Fournisseur',
        type: 'text',
        required: true,
        placeholder: 'Nom du fournisseur',
        listHint: true,
      },
      {
        key: 'quantity',
        label: 'Quantité',
        type: 'number',
        placeholder: '0',
      },
      {
        key: 'expectedDate',
        label: 'Livraison prévue',
        type: 'date',
      },
      {
        key: 'unitCost',
        label: 'Coût unitaire (€)',
        type: 'number',
        placeholder: '0.00',
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'textarea',
        span: 2,
        placeholder: 'Conditions, incoterms, contact…',
      },
    ],
    agentCode: 'STOCK',
    officeQuery: 'stock',
    activeStatuses: ['IN_TRANSIT', 'RECEIVED'],
    pendingStatuses: ['ORDERED'],
    kpiActiveLabel: 'En cours',
    kpiPendingLabel: 'À recevoir',
  },
  MRP: {
    module: 'MRP',
    title: 'MRP',
    callout: 'Planification des besoins matières. Les ordres de fabrication proposés restent soumis à validation humaine.',
    formTitle: 'Nouveau plan MRP',
    formSubtitle: 'Nomenclature et horizon',
    listTitle: 'Plans MRP',
    listSubtitle: 'OF et besoins',
    listToolbarTag: 'Plans de besoin matière',
    codeLabel: 'Code plan',
    codePlaceholder: 'MRP-Q1-01',
    titleLabel: 'Désignation',
    titlePlaceholder: 'Plan trimestriel assemblage',
    emptyIcon: 'MR',
    emptyTitle: 'Aucun plan',
    emptyDescription: 'Créez un plan MRP avec le formulaire à gauche.',
    statusOptions: [
      { value: 'PLANNED', label: 'Planifié' },
      { value: 'RUNNING', label: 'En cours' },
      { value: 'COMPLETED', label: 'Terminé' },
      { value: 'CANCELLED', label: 'Annulé' },
    ],
    defaultStatus: 'PLANNED',
    fields: [
      {
        key: 'bomRef',
        label: 'Nomenclature (BOM)',
        type: 'text',
        required: true,
        placeholder: 'BOM-REF-001',
        listHint: true,
      },
      {
        key: 'horizonDays',
        label: 'Horizon (jours)',
        type: 'number',
        placeholder: '30',
      },
      {
        key: 'quantityPlanned',
        label: 'Qté planifiée',
        type: 'number',
        placeholder: '0',
      },
      {
        key: 'startDate',
        label: 'Début plan',
        type: 'date',
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'textarea',
        span: 2,
        placeholder: 'Contraintes capacité, priorités…',
      },
    ],
    agentCode: 'ERP',
    officeQuery: 'erp',
    activeStatuses: ['RUNNING'],
    pendingStatuses: ['PLANNED'],
    kpiActiveLabel: 'En production',
    kpiPendingLabel: 'Planifiés',
  },
  ETL: {
    module: 'ETL',
    title: 'ETL',
    callout: 'Pipelines d\'intégration de données. Les synchronisations critiques nécessitent une validation CEO.',
    formTitle: 'Nouveau pipeline',
    formSubtitle: 'Source, cible et planification',
    listTitle: 'Pipelines',
    listSubtitle: 'Jobs d\'intégration',
    listToolbarTag: 'Jobs d\'intégration des données',
    codeLabel: 'Identifiant job',
    codePlaceholder: 'sync-crm-erp',
    titleLabel: 'Nom du pipeline',
    titlePlaceholder: 'Sync clients CRM → ERP',
    emptyIcon: 'ET',
    emptyTitle: 'Aucun pipeline',
    emptyDescription: 'Créez un pipeline avec le formulaire à gauche.',
    statusOptions: [
      { value: 'IDLE', label: 'Inactif' },
      { value: 'RUNNING', label: 'En cours' },
      { value: 'SUCCESS', label: 'Succès' },
      { value: 'FAILED', label: 'Échoué' },
    ],
    defaultStatus: 'IDLE',
    fields: [
      {
        key: 'source',
        label: 'Source',
        type: 'text',
        required: true,
        placeholder: 'ex. Salesforce, CSV S3',
        listHint: true,
      },
      {
        key: 'target',
        label: 'Cible',
        type: 'text',
        required: true,
        placeholder: 'ex. PostgreSQL, Data Warehouse',
      },
      {
        key: 'schedule',
        label: 'Fréquence',
        type: 'select',
        options: [
          { value: 'manual', label: 'Manuel' },
          { value: 'hourly', label: 'Horaire' },
          { value: 'daily', label: 'Quotidien' },
          { value: 'weekly', label: 'Hebdomadaire' },
        ],
      },
      {
        key: 'lastRunAt',
        label: 'Dernière exécution',
        type: 'date',
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'textarea',
        span: 2,
        placeholder: 'Mapping, règles de transformation…',
      },
    ],
    agentCode: 'ANALYTICS',
    officeQuery: 'analytics',
    activeStatuses: ['RUNNING', 'SUCCESS'],
    pendingStatuses: ['IDLE'],
    kpiActiveLabel: 'Actifs / OK',
    kpiPendingLabel: 'Inactifs',
  },
  EDI: {
    module: 'EDI',
    title: 'EDI',
    callout: 'Échanges B2B structurés (EDIFACT, factures électroniques). Aucun envoi externe sans validation humaine.',
    formTitle: 'Nouveau message',
    formSubtitle: 'Partenaire et format',
    listTitle: 'Messages EDI',
    listSubtitle: 'Flux B2B',
    listToolbarTag: 'Messages B2B structurés',
    codeLabel: 'Référence message',
    codePlaceholder: 'INV-2026-0042',
    titleLabel: 'Objet',
    titlePlaceholder: 'Facture client ACME',
    emptyIcon: 'ED',
    emptyTitle: 'Aucun message',
    emptyDescription: 'Créez un message EDI avec le formulaire à gauche.',
    statusOptions: [
      { value: 'PENDING', label: 'En attente' },
      { value: 'SENT', label: 'Envoyé' },
      { value: 'ACK', label: 'Accusé' },
      { value: 'ERROR', label: 'Erreur' },
    ],
    defaultStatus: 'PENDING',
    fields: [
      {
        key: 'partner',
        label: 'Partenaire',
        type: 'text',
        required: true,
        placeholder: 'Raison sociale ou GLN',
        listHint: true,
      },
      {
        key: 'direction',
        label: 'Sens',
        type: 'select',
        options: [
          { value: 'OUTBOUND', label: 'Sortant' },
          { value: 'INBOUND', label: 'Entrant' },
        ],
      },
      {
        key: 'format',
        label: 'Format',
        type: 'select',
        options: [
          { value: 'EDIFACT', label: 'EDIFACT' },
          { value: 'X12', label: 'ANSI X12' },
          { value: 'UBL', label: 'UBL / Facture élec.' },
          { value: 'XML', label: 'XML custom' },
        ],
      },
      {
        key: 'payloadRef',
        label: 'Réf. payload / fichier',
        type: 'text',
        placeholder: 's3://bucket/msg.xml',
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'textarea',
        span: 2,
        placeholder: 'Type document, numéro commande liée…',
      },
    ],
    agentCode: 'ERP',
    officeQuery: 'erp',
    activeStatuses: ['SENT', 'ACK'],
    pendingStatuses: ['PENDING'],
    kpiActiveLabel: 'Traités',
    kpiPendingLabel: 'En attente',
  },
};

export function getErpModuleConfig(module: string): ErpModuleConfig {
  const key = module.toUpperCase();
  const base = ERP_MODULE_CONFIGS[key] ?? ERP_MODULE_CONFIGS['CMS']!;
  const lib = DATA_LIBRARIES.find((l) => l.route === `/app/${module.toLowerCase()}`);
  return {
    ...base,
    libraryId: lib?.id ?? base.libraryId,
    accent: lib?.accent ?? base.accent,
  };
}

export function parseErpDetails(json?: string): Record<string, string> {
  if (!json?.trim()) return {};
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v != null) out[k] = String(v);
    }
    return out;
  } catch {
    return { note: json };
  }
}

export function buildErpDetails(fields: ErpFieldConfig[], values: Record<string, string>): string {
  const payload: Record<string, string | number> = {};
  for (const f of fields) {
    const raw = values[f.key]?.trim() ?? '';
    if (!raw) continue;
    payload[f.key] = f.type === 'number' ? Number(raw) || 0 : raw;
  }
  return Object.keys(payload).length ? JSON.stringify(payload) : '';
}

export function erpListHint(item: { detailsJson?: string }, fields: ErpFieldConfig[]): string {
  const details = parseErpDetails(item.detailsJson);
  const hintField = fields.find((f) => f.listHint);
  if (hintField && details[hintField.key]) return details[hintField.key];
  const first = fields.find((f) => details[f.key]);
  return first ? details[first.key] : '';
}
