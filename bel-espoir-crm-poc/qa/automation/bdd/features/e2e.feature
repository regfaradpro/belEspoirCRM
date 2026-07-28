# language: fr
Fonctionnalité: Parcours end-to-end - Prospect -> Compte -> Opportunité gagnée

  Contexte:
    Etant donné que les données du CRM sont réinitialisées

  @TC-E2E-01 @succes
  Scénario: Parcours complet réussi jusqu'à l'opportunité gagnée
    Etant donné qu'un compte et une opportunité existent via la qualification d'un prospect
    Quand je crée un devis pour cette opportunité avec un prix de 1200
    Et le devis est accepté par le client avec la preuve d'accord jointe
    Et je convertis le devis en commande
    Alors la réponse a le code 201
    Et une commande est créée
    Et l'opportunité passe en phase "Clôture" avec le statut "Gagnée"
    Quand je crée une réclamation de catégorie "Retard" liée à cette commande
    Et je résous la réclamation
    Alors la réclamation a le statut "Résolu"

  @TC-E2E-02 @echec
  Scénario: Rupture de parcours - le devis expire avant conversion
    Etant donné qu'un compte et une opportunité existent via la qualification d'un prospect
    Quand je crée un devis déjà expiré pour cette opportunité avec un prix de 1200
    Et je convertis le devis en commande
    Alors la réponse a le code 409
    Et l'erreur retournée est "QUOTE_EXPIRED"
    Et aucune commande supplémentaire n'est créée
    Et l'opportunité n'est pas passée en phase "Clôture"
