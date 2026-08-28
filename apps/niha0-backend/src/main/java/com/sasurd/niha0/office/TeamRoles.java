package com.sasurd.niha0.office;

/** Intitulés métier des 10 équipes Nihao (miroir frontend team-roles.ts). */
final class TeamRoles {

    record TeamDef(String department, String chiefTitle, String[] memberTitles) {}

    private static final TeamDef[] TEAMS = {
            new TeamDef("Accueil", "Responsable Accueil & Réception", new String[]{
                    "Hôte d'accueil", "Standardiste", "Agent de réception", "Concierge"
            }),
            new TeamDef("Support", "Responsable Support Client", new String[]{
                    "Technicien support N1", "Technicien support N2", "Spécialiste incidents", "Agent helpdesk"
            }),
            new TeamDef("Vente", "Directeur Commercial", new String[]{
                    "Commercial terrain", "Account Manager", "Chargé de clientèle", "Business Developer"
            }),
            new TeamDef("RH", "Responsable Ressources Humaines", new String[]{
                    "Chargé de recrutement", "Gestionnaire de paie", "Responsable formation", "Chargé relations sociales"
            }),
            new TeamDef("Finance", "Directeur Financier", new String[]{
                    "Comptable général", "Contrôleur de gestion", "Trésorier", "Auditeur interne"
            }),
            new TeamDef("Marketing", "Directeur Marketing", new String[]{
                    "Chargé de communication", "Community Manager", "Chef de produit marketing", "Traffic Manager"
            }),
            new TeamDef("Dev", "Lead Developer", new String[]{
                    "Développeur frontend", "Développeur backend", "Ingénieur DevOps", "Architecte logiciel"
            }),
            new TeamDef("Design", "Directeur Artistique", new String[]{
                    "UX Designer", "UI Designer", "Product Designer", "Motion Designer"
            }),
            new TeamDef("Ops", "Responsable Exploitation IT", new String[]{
                    "Administrateur systèmes", "Ingénieur réseau", "Technicien infrastructure", "Gestionnaire de parc"
            }),
            new TeamDef("QA", "Responsable Qualité & Tests", new String[]{
                    "Testeur fonctionnel", "Ingénieur QA automatisation", "QA Engineer", "Responsable recette"
            }),
    };

    private TeamRoles() {}

    static TeamDef team(int rowId) {
        int i = rowId - 1;
        if (i < 0 || i >= TEAMS.length) {
            return TEAMS[0];
        }
        return TEAMS[i];
    }

    static String memberTitle(int rowId, int memberIndex) {
        TeamDef team = team(rowId);
        int idx = Math.max(0, Math.min(team.memberTitles().length - 1, memberIndex));
        return team.memberTitles()[idx];
    }
}
