# language: fr
# AC2.1 conversion sans ressaisie, AC2.2 blocage sans acceptation, AC2.3 blocage sans preuve
Fonctionnalité: US2 - Conversion d'un devis en commande

  Contexte:
    Etant donné que les données du CRM sont réinitialisées
    Et qu'un compte et une opportunité existent via la qualification d'un prospect

  @TC-US2-01 @succes
  Scénario: Conversion réussie d'un devis accepté avec preuve jointe
    Quand je crée un devis pour cette opportunité avec un prix de 850
    Et le devis est accepté par le client avec la preuve d'accord jointe
    Et je convertis le devis en commande
    Alors la réponse a le code 201
    Et une commande est créée
    Et l'opportunité passe en phase "Clôture" avec le statut "Gagnée"

  @TC-US2-02 @echec
  Scénario: Échec - conversion refusée avant acceptation par le client
    Quand je crée un devis pour cette opportunité avec un prix de 850
    Et je convertis le devis en commande
    Alors la réponse a le code 409
    Et l'erreur retournée est "QUOTE_NOT_ACCEPTED"

  @TC-US2-03 @echec
  Scénario: Échec - conversion refusée sans preuve d'accord jointe
    Quand je crée un devis pour cette opportunité avec un prix de 850
    Et le devis est accepté par le client sans preuve d'accord jointe
    Et je convertis le devis en commande
    Alors la réponse a le code 409
    Et l'erreur retournée est "PROOF_MISSING"
