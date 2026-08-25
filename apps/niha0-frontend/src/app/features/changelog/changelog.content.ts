export interface ChangelogEntry {
  version: string;
  date: string;
  sections: { title: string; items: string[] }[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: '0.7.0',
    date: '2026-08-25',
    sections: [
      {
        title: 'Ajouts',
        items: [
          'Studio drag-and-drop (palette, canvas, arêtes)',
          'pgvector + ERP REAL (CMS/SCM/MRP/ETL/EDI)',
          'Access token HttpOnly + CSRF complet en prod',
        ],
      },
    ],
  },
  {
    version: '0.6.2',
    date: '2026-08-25',
    sections: [
      {
        title: 'Ajouts',
        items: [
          'RBAC permissions appliquées (JWT authorities + PreAuthorize OS)',
          'Chat branché sur le RAG réel + badges provider / démo',
          'Templates Studio simple / HITL ; Runtime lit les slugs Studio',
          'Rate-limit OS (chat, runtime, scan guardrails)',
        ],
      },
      {
        title: 'Corrections',
        items: [
          'Bouton Reprendre runtime aligné sur le statut INTERRUPTED',
        ],
      },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-08-25',
    sections: [
      {
        title: 'Ajouts',
        items: [
          'RAG vectoriel (hash / OpenAI) + recherche hybride dans Données entreprise',
          'SSO Google OIDC (opt-in) + écran callback',
          'Préparation CSRF cookie (CSRF_ENABLED) et rotation JWT dual-secret',
          'Template CD production Fly.io',
        ],
      },
      {
        title: 'Sécurité',
        items: [
          'Headers Spring + CSP nginx',
          'Rate-limit auth élargi',
          'Audit LOGIN / facturation ; panneau Audit actif',
        ],
      },
      {
        title: 'Modifications',
        items: [
          'Shells ERP : roadmap PIM explicite sur pages « Bientôt »',
        ],
      },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-08-25',
    sections: [
      {
        title: 'Ajouts',
        items: [
          'SumUp Hosted Checkout (PRO / BUSINESS)',
          'Refresh token httpOnly + access token en mémoire',
          'MFA TOTP réel + codes de récupération',
          'E-mails transactionnels et webhooks sortants',
        ],
      },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-08-25',
    sections: [
      {
        title: 'Ajouts',
        items: [
          'Réinitialisation mot de passe et invitations organisation',
          'Gestion des rôles membres (PATCH/DELETE)',
          'Export RGPD / effacement compte et pages légales',
          'Feedback, centre d\'aide, bannière cookies',
          'Plan billing stub (FREE / PRO / BUSINESS)',
          'Webhooks sortants CRUD (livraison différée)',
          'UI écriture Comptabilité & Marketing',
          'Préférence locale fr/en, helper analytics',
        ],
      },
      {
        title: 'Modifications',
        items: [
          'Marketing retiré du statut « Bientôt » dans la sidebar',
          'Rapport d\'audit rafraîchi comme source de vérité REAL/MOCK/SHELL',
        ],
      },
      {
        title: 'Sécurité',
        items: [
          'Rate limit étendu aux endpoints reset mot de passe',
          'Login démo reste désactivable en production',
        ],
      },
    ],
  },
];
