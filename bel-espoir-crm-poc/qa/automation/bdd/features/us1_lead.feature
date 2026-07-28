# language: fr
# AC1.1 champs obligatoires, AC1.2 doublon (email/téléphone/TVA), AC1.3 assignation automatique
Fonctionnalité: US1 - Création et qualification d'un prospect (Lead)

  Contexte:
    Etant donné que les données du CRM sont réinitialisées

  @TC-US1-01 @succes
  Scénario: Création réussie d'un Lead avec toutes les informations obligatoires
    Quand je crée un prospect avec :
      | topic         | Demande de transport de fret régulier |
      | lastName      | Durand                                |
      | company       | Transports Durand SPRL                |
      | email         | contact@transports-durand.be          |
      | businessPhone | +3265123456                           |
      | city          | Mons                                  |
    Alors la réponse a le code 201
    Et le prospect créé a le statut "Nouveau"
    Et le prospect créé a l'étape BPF "Qualifier"
    Et le prospect créé est assigné à la zone "Hainaut"

  @TC-US1-02 @echec
  Scénario: Échec - un champ obligatoire est manquant
    Quand je crée un prospect avec :
      | lastName | Julie |
    Alors la réponse a le code 400
    Et l'erreur retournée est "VALIDATION_ERROR"

  @TC-US1-03 @echec
  Scénario: Échec - doublon détecté sur l'e-mail
    Etant donné qu'un prospect existe déjà avec :
      | topic    | Demande initiale              |
      | lastName | Durand                         |
      | company  | Transports Durand SPRL         |
      | email    | contact@transports-durand.be   |
    Quand je crée un prospect avec :
      | topic    | Nouvelle demande               |
      | lastName | Autre                          |
      | company  | Une autre société               |
      | email    | contact@transports-durand.be   |
    Alors la réponse a le code 409
    Et l'erreur retournée est "DUPLICATE_LEAD"
