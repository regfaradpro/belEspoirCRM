# Cas de test — US1 : Enregistrement d'un prospect (Lead)

**Fonctionnalité liée :** création d'un Prospect (onglet Résumé), champs conformes à
l'instance Dynamics 365 réelle (Rubrique, Nom, Société obligatoires).
**Critères d'acceptance couverts :** AC1.1 (champs obligatoires), AC1.2 (doublon
e-mail/téléphone/n° de TVA), AC1.3 (assignation automatique par zone géographique)
**Endpoint testé :** `POST /api/leads`
**Automatisé :** voir `qa/automation/test.sh` et la suite BDD
`qa/automation/bdd/features/us1_lead.feature` (scénarios `@TC-US1-01/02/03`, succès et échec)

Voir aussi `TC-LEAD-QUAL-bpf.md` pour la suite du parcours (qualification du prospect).

---

## TC-US1-01 — Création d'un Prospect valide

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Positif |
| **Préconditions** | Aucun Prospect existant avec le même e-mail/téléphone |
| **Données de test** | `topic: "Demande de transport de fret régulier"`, `firstName: "Marc"`, `lastName: "Durand"`, `email: "contact@transports-durand.be"`, `businessPhone: "+3265123456"`, `company: "Transports Durand SPRL"`, `city: "Mons"` |
| **Étapes** | 1. Envoyer `POST /api/leads` avec les données ci-dessus |
| **Résultat attendu** | Code `201`. Réponse contient `"message": "Prospect enregistré avec succès"`, un objet `lead` avec `status: "Nouveau"`, `bpfStage: "Qualifier"`, une zone assignée (`"Hainaut"`) et un propriétaire (`"Sophie Renard"`). Une tâche de rappel J+1 est créée. |

## TC-US1-02 — Rejet si un champ obligatoire est manquant

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Négatif |
| **Préconditions** | Aucune |
| **Données de test** | `{ "lastName": "Julie" }` (rubrique et société manquantes) |
| **Étapes** | 1. Envoyer `POST /api/leads` |
| **Résultat attendu** | Code `400`. Réponse contient `"error": "VALIDATION_ERROR"` et la liste des champs manquants (`topic`, `company`). Les 3 champs réellement obligatoires dans le formulaire D365 sont : Rubrique, Nom, Société. |

## TC-US1-03 — Détection de doublon (e-mail ou téléphone déjà existant)

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Négatif |
| **Préconditions** | Le Prospect du TC-US1-01 existe déjà |
| **Données de test** | Même `email` que TC-US1-01, autres champs valides |
| **Étapes** | 1. Rejouer `POST /api/leads` avec le même e-mail |
| **Résultat attendu** | Code `409`. Réponse contient `"error": "DUPLICATE_LEAD"` et l'`existingLeadId` du Prospect d'origine. |

## TC-US1-09 — Détection de doublon sur le n° de TVA (AC1.2)

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Négatif |
| **Préconditions** | Un Prospect existe déjà avec `vatNumber: "BE 0648.747.183"` |
| **Données de test** | Nouveau contact (nom/société/e-mail différents), mais `vatNumber: "BE0648747183"` (même n°, formaté différemment) |
| **Étapes** | 1. Envoyer `POST /api/leads` avec ce n° de TVA |
| **Résultat attendu** | Code `409`. Réponse contient `"error": "DUPLICATE_LEAD"` — la comparaison ignore espaces/points/casse (`BE 0648.747.183` ≡ `BE0648747183`). |

## TC-US1-10 — Rejet si le n° de TVA n'est pas au format belge (AC1.1)

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Négatif |
| **Données de test** | `vatNumber: "12345"` |
| **Étapes** | 1. Envoyer `POST /api/leads` |
| **Résultat attendu** | Code `400`. Réponse contient `"error": "VALIDATION_ERROR"` — le format attendu est `BE` + 10 chiffres. |

## TC-US1-04 — Absence de doublon si e-mail/téléphone différents

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Positif |
| **Étapes** | 1. Envoyer `POST /api/leads` avec un nouveau contact |
| **Résultat attendu** | Code `201`, création normale, pas d'erreur `DUPLICATE_LEAD`. |

## TC-US1-05 — Assignation automatique selon la zone géographique (Ville)

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Positif |
| **Données de test** | `city: "Bruxelles"` |
| **Étapes** | 1. Envoyer `POST /api/leads` avec cette ville |
| **Résultat attendu** | Le Prospect créé a `zone: "Bruxelles"` et `owner: "Julien Petit"`. |

## TC-US1-06 — Ville non reconnue → propriétaire par défaut

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Limite (edge case) |
| **Données de test** | `city: "Ville inconnue"` |
| **Étapes** | 1. Envoyer `POST /api/leads` |
| **Résultat attendu** | `zone: "Autre"`, `owner: "Claire Moreau"` (propriétaire par défaut). |

## TC-US1-07 — Adresse complète correctement enregistrée

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Positif |
| **Données de test** | `street1`, `street2`, `street3`, `city`, `stateProvince`, `postalCode`, `country` tous renseignés |
| **Étapes** | 1. `POST /api/leads` |
| **Résultat attendu** | L'objet `address` du prospect créé reprend fidèlement tous les champs saisis. |

## TC-US1-08 — Lecture de la liste des Prospects

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Positif |
| **Étapes** | 1. `GET /api/leads` |
| **Résultat attendu** | Code `200`, tableau JSON avec les prospects, le plus récent en premier. |
