package com.sasurd.niha0.agents;

import com.sasurd.niha0.agents.dto.AgentRecommendation;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Demo recommendation engine — honest mock heuristics, no external LLM calls.
 * Active when {@code niha0.ai.provider=mock} (default).
 */
@Service
@ConditionalOnProperty(name = "niha0.ai.provider", havingValue = "mock", matchIfMissing = true)
public class MockAgentService implements AgentRecommendationProvider {

    private static final Map<String, AgentRecommendation> RECOMMENDATIONS = new LinkedHashMap<>();
    private static final Map<String, String> TASK_BUBBLES = new LinkedHashMap<>();

    static {
        RECOMMENDATIONS.put("VENTES", new AgentRecommendation(
                "FOLLOW_UP_OPPORTUNITY",
                "Relancer opportunité TechNova",
                "Je propose d'envoyer une relance à TechNova. Montant potentiel : 4 800 €.",
                "{\"opportunityRef\":\"OPP-TN\",\"amount\":4800}"));
        RECOMMENDATIONS.put("COMPTABILITE", new AgentRecommendation(
                "SEND_PAYMENT_REMINDER",
                "Relance facture FAC-2026-014",
                "Une relance de paiement est prête pour la facture F-2026-014.",
                "{\"invoiceRef\":\"FAC-2026-014\",\"amount\":4200}"));
        RECOMMENDATIONS.put("STOCK", new AgentRecommendation(
                "STOCK_ALERT",
                "Alerte réapprovisionnement SKU-42",
                "Stock bas détecté — proposition d'ordre d'achat.",
                "{\"sku\":\"SKU-42\",\"qty\":120}"));
        RECOMMENDATIONS.put("SUPPORT", new AgentRecommendation(
                "RESPOND_TICKET",
                "Répondre ticket livraison",
                "Je prépare une réponse au client VIP.",
                "{\"ticketRef\":\"TKT-003\"}"));
        RECOMMENDATIONS.put("JURIDIQUE", new AgentRecommendation(
                "CONTRACT_REMINDER",
                "Échéance contrat J+14",
                "Une échéance contractuelle approche dans 14 jours.",
                "{\"contractId\":\"CTR-09\"}"));
        RECOMMENDATIONS.put("ANALYTICS", new AgentRecommendation(
                "ANOMALY_ALERT",
                "Tendance CA à surveiller",
                "Une tendance mérite votre attention sur le CA hebdo.",
                "{\"metric\":\"revenue_wow\"}"));
        RECOMMENDATIONS.put("STRATEGIE", new AgentRecommendation(
                "WEEKLY_PRIORITIES",
                "Priorités de la semaine",
                "Je consolide les priorités de la semaine.",
                "{\"period\":\"WEEK\"}"));
        RECOMMENDATIONS.put("CRM", new AgentRecommendation(
                "UPDATE_TIMELINE",
                "Historique client mis à jour",
                "Timeline Maison Dupont enrichie avec 3 interactions.",
                "{\"customer\":\"Maison Dupont\"}"));
        RECOMMENDATIONS.put("ERP", new AgentRecommendation(
                "OPS_WORKFLOW",
                "Workflow opérationnel",
                "Workflow achat → réception en cours de préparation.",
                "{\"workflow\":\"PURCHASE_RECEIVE\"}"));
        RECOMMENDATIONS.put("RH", new AgentRecommendation(
                "LEAVE_REQUEST",
                "Demande de congé à examiner",
                "Une demande de congé attend votre avis.",
                "{\"employee\":\"Léa Moreau\"}"));
        RECOMMENDATIONS.put("MARKETING", new AgentRecommendation(
                "PUBLISH_POST",
                "Publication LinkedIn prête",
                "Une publication LinkedIn est prête. Souhaitez-vous la publier ?",
                "{\"channel\":\"LINKEDIN\"}"));
        RECOMMENDATIONS.put("CEO_DIRECTION", new AgentRecommendation(
                "WEEKLY_BRIEF",
                "Brief hebdomadaire",
                "Synthèse KPIs : CA, pipeline, tickets, validations.",
                "{\"period\":\"WEEK\"}"));

        RECOMMENDATIONS.put("COMMERCIAL", RECOMMENDATIONS.get("VENTES"));
        RECOMMENDATIONS.put("RELATION_CLIENT", RECOMMENDATIONS.get("SUPPORT"));
        RECOMMENDATIONS.put("ADMINISTRATIF", RECOMMENDATIONS.get("ERP"));

        TASK_BUBBLES.put("VENTES", "Analyse des prospects prioritaires…");
        TASK_BUBBLES.put("COMPTABILITE", "3 factures à surveiller.");
        TASK_BUBBLES.put("STOCK", "Vérification des niveaux de stock…");
        TASK_BUBBLES.put("SUPPORT", "Je prépare une réponse au client.");
        TASK_BUBBLES.put("JURIDIQUE", "Contrat analysé : échéance détectée.");
        TASK_BUBBLES.put("ANALYTICS", "Une tendance mérite votre attention.");
        TASK_BUBBLES.put("STRATEGIE", "Je consolide les priorités de la semaine.");
        TASK_BUBBLES.put("CRM", "Historique client mis à jour.");
        TASK_BUBBLES.put("ERP", "Workflow opérationnel en cours.");
        TASK_BUBBLES.put("RH", "Demande de congé à examiner.");
        TASK_BUBBLES.put("MARKETING", "Proposition de campagne prête.");
        TASK_BUBBLES.put("THINKING", "Réflexion en cours…");
        TASK_BUBBLES.put("PREPARING", "Brouillon en préparation…");
        TASK_BUBBLES.put("WAITING_APPROVAL", "J'attends votre validation.");
        TASK_BUBBLES.put("EXECUTING", "Exécution en cours…");
    }

    /** Shared fallback used by the OpenAI provider when the LLM call fails. */
    public static AgentRecommendation demoRecommend(String agentCode) {
        return RECOMMENDATIONS.getOrDefault(agentCode, new AgentRecommendation(
                "GENERIC_ACTION",
                "Action recommandée pour " + agentCode,
                "Recommandation générique basée sur les données de démonstration.",
                "{\"agentCode\":\"" + agentCode + "\"}"));
    }

    public static String demoBubble(String agentCode, String status) {
        if (status != null && TASK_BUBBLES.containsKey(status)) {
            return TASK_BUBBLES.get(status);
        }
        return TASK_BUBBLES.getOrDefault(agentCode, "En mission…");
    }

    @Override
    public AgentRecommendation recommend(String agentCode) {
        return demoRecommend(agentCode);
    }

    @Override
    public String taskBubble(String agentCode, String status) {
        return demoBubble(agentCode, status);
    }

    @Override
    public boolean isDemoEngine() {
        return true;
    }

    @Override
    public String engineLabel() {
        return "Démo (mock — aucune IA réelle branchée)";
    }
}
