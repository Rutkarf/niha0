/** Audiences publiques NIHAO (profils d’inscription / offre) — distinctes des rôles métier OWNER/ADMIN. */
export type AudienceRoleId =
  | 'particulier'
  | 'professionnel'
  | 'association'
  | 'entreprise'
  | 'gouvernement'
  | 'partenaire';

export interface AudiencePlan {
  code: string;
  name: string;
  priceLabel: string;
  priceNote: string;
  featured?: boolean;
  highlights: string[];
  cta: string;
  registerQuery?: Record<string, string>;
}

export interface AudienceRole {
  id: AudienceRoleId;
  label: string;
  short: string;
  blurb: string;
  sectorDefault: string;
  companyLabel: string;
  recommendedPlan: string;
  plans: AudiencePlan[];
  modules: { title: string; text: string }[];
}

export const AUDIENCE_ROLES: AudienceRole[] = [
  {
    id: 'particulier',
    label: 'Particulier',
    short: 'Usage personnel assisté',
    blurb: 'Organisez vos projets, documents et assistants IA avec une validation simple.',
    sectorDefault: 'Particulier',
    companyLabel: 'Nom du profil',
    recommendedPlan: 'ESSENTIEL',
    plans: [
      {
        code: 'ESSENTIEL',
        name: 'Essentiel',
        priceLabel: '0 €',
        priceNote: '/ mois · 1 siège',
        featured: true,
        highlights: [
          '1 siège · profil personnel',
          '500 Mo de stockage',
          '30 actions IA / jour',
          'AI Office simplifié',
          'Export privacy inclus',
        ],
        cta: 'Créer mon espace perso',
      },
      {
        code: 'PLUS',
        name: 'Plus',
        priceLabel: '9 €',
        priceNote: '/ mois · HT',
        highlights: [
          '2 Go de stockage',
          '150 actions IA / jour',
          'Templates perso & rappels',
          'Support e-mail',
          'Historique 90 jours',
        ],
        cta: 'Passer sur Plus',
      },
      {
        code: 'FAMILLE',
        name: 'Famille',
        priceLabel: '15 €',
        priceNote: '/ mois · 3 sièges · HT',
        highlights: [
          '3 sièges · espace partagé',
          '5 Go de stockage',
          '250 actions IA / jour',
          'Agenda & documents communs',
          'Support prioritaire',
        ],
        cta: 'Choisir Famille',
      },
    ],
    modules: [
      { title: 'Assistants', text: 'Agents pour agenda, documents et suivi de projets perso.' },
      { title: 'Confidentialité', text: 'Données isolées, export et suppression self-service.' },
      { title: 'Simple', text: 'Parcours court, sans jargon entreprise.' },
    ],
  },
  {
    id: 'professionnel',
    label: 'Professionnel',
    short: 'Indépendants & freelances',
    blurb: 'Pilotez clients, devis et relances avec des agents que vous validez.',
    sectorDefault: 'Profession libérale',
    companyLabel: 'Nom d’activité',
    recommendedPlan: 'PRO',
    plans: [
      {
        code: 'STARTER',
        name: 'Starter',
        priceLabel: '0 €',
        priceNote: '/ mois · solo',
        highlights: ['1 siège', '1 Go', '50 IA / jour', 'CRM léger', 'Factures simples'],
        cta: 'Essayer Starter',
      },
      {
        code: 'PRO',
        name: 'Pro Solo',
        priceLabel: '19 €',
        priceNote: '/ mois · HT',
        featured: true,
        highlights: [
          '3 sièges collab',
          '5 Go stockage',
          '300 IA / jour',
          'CRM + devis',
          'Pack Sales add-on',
        ],
        cta: 'Choisir Pro Solo',
      },
      {
        code: 'PRO_PLUS',
        name: 'Pro +',
        priceLabel: '35 €',
        priceNote: '/ mois · HT',
        highlights: ['10 sièges', '10 Go', '800 IA / jour', 'Studio agents', 'Support prioritaire'],
        cta: 'Passer Pro +',
      },
    ],
    modules: [
      { title: 'CRM + Sales', text: 'Pipeline client, devis et relances assistées.' },
      { title: 'Facturation', text: 'Suivi des règlements et rappels validés.' },
      { title: 'Studio', text: 'Automatisations perso sans perdre le contrôle.' },
    ],
  },
  {
    id: 'association',
    label: 'Association',
    short: 'ESS, clubs & ONG',
    blurb: 'Adhérents, bénévoles, subventions et communication — avec gouvernance claire.',
    sectorDefault: 'Association',
    companyLabel: 'Nom de l’association',
    recommendedPlan: 'ASSO',
    plans: [
      {
        code: 'ASSO_FREE',
        name: 'Asso Free',
        priceLabel: '0 €',
        priceNote: '/ mois · éligibilité ESS',
        highlights: ['5 sièges', '2 Go', '80 IA / jour', 'Annuaire adhérents', 'Campagnes e-mail simples'],
        cta: 'Créer l’espace asso',
      },
      {
        code: 'ASSO',
        name: 'Asso Pro',
        priceLabel: '24 €',
        priceNote: '/ mois · HT',
        featured: true,
        highlights: [
          '25 sièges bénévoles',
          '15 Go',
          '400 IA / jour',
          'Subventions & dossiers',
          'Reporting conseil d’admin',
        ],
        cta: 'Choisir Asso Pro',
      },
      {
        code: 'ASSO_NET',
        name: 'Réseau',
        priceLabel: '79 €',
        priceNote: '/ mois · HT',
        highlights: ['100 sièges', '40 Go', '2 000 IA / jour', 'Multi-antennes', 'Support dédié'],
        cta: 'Passer Réseau',
      },
    ],
    modules: [
      { title: 'Adhérents', text: 'Fiches, cotisations, campagnes et bénévolat.' },
      { title: 'Gouvernance', text: 'Validations bureau / CA sur actions sensibles.' },
      { title: 'Subventions', text: 'Dossiers et échéances assistés par agents.' },
    ],
  },
  {
    id: 'entreprise',
    label: 'Entreprise',
    short: 'PME · ETI · scale-up',
    blurb: 'Hub ERP/CRM multi-équipes : agents IA, quotas et packs métier.',
    sectorDefault: 'Services digitaux & SaaS',
    companyLabel: 'Nom de l’entreprise',
    recommendedPlan: 'PRO',
    plans: [
      {
        code: 'FREE',
        name: 'FREE',
        priceLabel: '0 €',
        priceNote: '/ mois',
        highlights: ['3 sièges', '100 Mo', '20 IA / jour', 'AI Office', 'Docs'],
        cta: 'Commencer gratuitement',
      },
      {
        code: 'PRO',
        name: 'PRO',
        priceLabel: '39 €',
        priceNote: '/ mois · HT',
        featured: true,
        highlights: ['25 sièges', '5 Go', '500 IA / jour', 'Packs add-on', 'SSO Google', 'Support e-mail'],
        cta: 'Créer mon espace',
      },
      {
        code: 'BUSINESS',
        name: 'BUSINESS',
        priceLabel: '99 €',
        priceNote: '/ mois · HT',
        highlights: ['100 sièges', '50 Go', '5 000 IA / jour', 'Packs inclus', 'Trust pack', 'Support prioritaire'],
        cta: 'Passer BUSINESS',
      },
    ],
    modules: [
      { title: 'CRM + Sales', text: 'Pipeline commercial unifié.' },
      { title: 'Ops WMS + PIM', text: 'Stock et référentiel produits.' },
      { title: 'Studio + Marketplace', text: 'Industrialiser les agents métier.' },
    ],
  },
  {
    id: 'gouvernement',
    label: 'Gouvernement',
    short: 'Secteur public & collectivités',
    blurb: 'Conformité renforcée, traçabilité, hébergement UE et workflows d’approbation.',
    sectorDefault: 'Secteur public',
    companyLabel: 'Entité / collectivité',
    recommendedPlan: 'PUBLIC',
    plans: [
      {
        code: 'PUBLIC_COLLECT',
        name: 'Collectivité',
        priceLabel: 'à partir de 59 €',
        priceNote: '/ mois · communes & interco · HT',
        highlights: [
          'Jusqu’à 50 sièges agents',
          'Hébergement UE',
          'Workflows d’approbation',
          'Journalisation & export',
          'Support e-mail dédié',
        ],
        cta: 'Demander un devis collectivité',
      },
      {
        code: 'PUBLIC',
        name: 'Public',
        priceLabel: 'à partir de 119 €',
        priceNote: '/ mois · marché / accord-cadre · HT',
        featured: true,
        highlights: [
          'Sièges & quotas contractualisés',
          'Hébergement UE prioritaire',
          'Audit trail & MFA imposables',
          'DPA / questionnaires sécurité',
          'Support dédié + SLA',
        ],
        cta: 'Demander un devis',
      },
      {
        code: 'PUBLIC_SOV',
        name: 'Souverain',
        priceLabel: 'Sur devis',
        priceNote: 'exigences renforcées · sous marché public',
        highlights: [
          'Contrôles accès avancés',
          'Revue conformité continue',
          'Intégrations SSO entreprise',
          'Pack Trust / SOC 2',
          'Accompagnement RSSI',
        ],
        cta: 'Parler à Trust',
      },
    ],
    modules: [
      { title: 'Conformité', text: 'SOC 2, RGPD, OWASP, accessibilité WCAG.' },
      { title: 'Gouvernance', text: 'Circuits de validation multi-niveaux.' },
      { title: 'Interop', text: 'API, SSO et journalisation pour SI public.' },
    ],
  },
  {
    id: 'partenaire',
    label: 'Partenaire',
    short: 'Revendeurs · intégrateurs · ISV',
    blurb: 'Revendez NIHAO, déployez pour vos clients, publiez des agents marketplace.',
    sectorDefault: 'Partenariat / Intégration',
    companyLabel: 'Nom du partenaire',
    recommendedPlan: 'PARTNER',
    plans: [
      {
        code: 'PARTNER',
        name: 'Partner',
        priceLabel: '0 €',
        priceNote: 'accès portail partenaire',
        featured: true,
        highlights: [
          'Console multi-clients',
          'Marges & deals enregistrés',
          'Sandbox démo',
          'Co-branding limité',
          'Enablement produit',
        ],
        cta: 'Devenir partenaire',
      },
      {
        code: 'PARTNER_PLUS',
        name: 'Partner Plus',
        priceLabel: '39 €',
        priceNote: '/ mois · MDF & co-selling · HT',
        highlights: [
          'Deal registration avancée',
          'Kit co-marketing',
          'Formation certifiante',
          'Support pre-sales prioritaire',
          'Marges volume négociées',
        ],
        cta: 'Passer Partner Plus',
      },
      {
        code: 'PARTNER_PRO',
        name: 'Partner Pro',
        priceLabel: 'à partir de 89 €',
        priceNote: '/ mois · volume & MDF · HT',
        highlights: [
          'Marketplace privée',
          'Agents packagés',
          'Support pre-sales',
          'Accord cadre clients',
          'Sandbox multi-tenant',
        ],
        cta: 'Accélérer le partenariat',
      },
    ],
    modules: [
      { title: 'Portail', text: 'Suivi des tenants clients et deals.' },
      { title: 'Marketplace', text: 'Publier et installer des graphes agents.' },
      { title: 'Enablement', text: 'Kits démo, pricing partenaire, co-selling.' },
    ],
  },
];

/** Ordre d’affichage : alphabétique FR (Association → … → Professionnel). */
AUDIENCE_ROLES.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));

export function audienceById(id: string | null | undefined): AudienceRole {
  return AUDIENCE_ROLES.find((r) => r.id === id) ?? AUDIENCE_ROLES.find((r) => r.id === 'entreprise')!;
}

export function isAudienceRoleId(value: string | null | undefined): value is AudienceRoleId {
  return AUDIENCE_ROLES.some((r) => r.id === value);
}

/** Slots highlights — aligne la hauteur des cartes offre sur /login. */
export const MAX_PLAN_HIGHLIGHTS = Math.max(
  ...AUDIENCE_ROLES.flatMap((r) => r.plans.map((p) => p.highlights.length)),
);
