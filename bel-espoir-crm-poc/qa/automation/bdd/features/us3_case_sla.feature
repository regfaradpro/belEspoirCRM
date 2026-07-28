# language: fr
# AC3.1 rattachement obligatoire à une commande, AC3.2 SLA automatique, AC3.3 escalade
Fonctionnalité: US3 - Réclamation client & SLA

  Contexte:
    Etant donné que les données du CRM sont réinitialisées
    Et qu'une commande existe via le parcours complet Prospect -> Devis -> Commande

  @TC-US3-01 @succes
  Scénario: Résolution d'une réclamation dans les délais du SLA
    Quand je crée une réclamation de catégorie "Retard" liée à cette commande
    Et je résous la réclamation
    Alors la réponse a le code 200
    Et la réclamation a le statut "Résolu"

  @TC-US3-02 @echec
  Scénario: Dépassement du SLA et escalade automatique
    Quand je crée une réclamation de catégorie "Retard" liée à cette commande, ouverte depuis 50 heures
    Alors la réclamation a le statut "SLA dépassé"
    Quand je crée une réclamation de catégorie "Dommage marchandise" liée à cette commande, ouverte depuis 50 heures
    Alors la réclamation a le statut "Escaladé - Direction"

  @TC-US3-03 @echec
  Scénario: Échec - réclamation refusée sans commande associée
    Quand je crée une réclamation de catégorie "Facturation" sans commande associée
    Alors la réponse a le code 400
    Et l'erreur retournée est "VALIDATION_ERROR"
