# Cas de test — US2 : Conversion d'un devis en commande

**Fonctionnalité liée :** transformation d'un devis (Quote), lié à une **Opportunité**,
en commande (Order) une fois accepté par le client avec preuve d'accord jointe.
**Critères d'acceptance couverts :** AC2.1 (conversion sans ressaisie + montant de
l'Opportunité synchronisé depuis le devis), AC2.2 (blocage sans acceptation client),
AC2.3 (blocage sans preuve d'accord jointe, et anti-double-commande sur une opportunité
déjà gagnée)
**Endpoints testés :** `POST /api/quotes`, `PATCH /api/quotes/:id`, `POST /api/quotes/:id/convert`
**Automatisé :** voir `qa/automation/test.sh` et la suite BDD
`qa/automation/bdd/features/us2_quote_order.feature` (scénarios `@TC-US2-01/02/03`,
succès et échec), ainsi que `qa/automation/bdd/features/e2e.feature`

**Prérequis de la chaîne complète :** un Compte + une Opportunité doivent exister avant
de créer un devis — soit via la qualification d'un Prospect (`TC-LEAD-QUAL-01`), soit via
une création manuelle d'Opportunité (`TC-OPP-04`).

---

## TC-US2-00 — Création d'un devis lié à une Opportunité (prérequis)

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Positif |
| **Préconditions** | Une Opportunité existe déjà |
| **Données de test** | `opportunityId: "<ID opportunité>"`, `client: "Transports Durand SPRL"`, `trajet: "Mons -> Charleroi"`, `price: 850` |
| **Étapes** | 1. Envoyer `POST /api/quotes` |
| **Résultat attendu** | Code `201`. Devis créé avec `status: "Envoyé"`, `proofAttached: false`, expiration à J+15. |

## TC-US2-01 — Conversion réussie d'un devis accepté avec preuve jointe

| Champ | Détail |
|---|---|
| **Priorité** | Critique |
| **Type** | Positif |
| **Préconditions** | Devis existant (TC-US2-00), statut `"Accepté par le client"`, `proofAttached: true` |
| **Étapes** | 1. `PATCH /api/quotes/:id` avec `{status: "Accepté par le client", proofAttached: true}` <br> 2. `POST /api/quotes/:id/convert` |
| **Résultat attendu** | Code `201`. Une `order` est créée avec les mêmes données, sans ressaisie. L'**Opportunité liée passe en phase `"Clôture"` et statut `"Gagnée"`** (voir `TC-OPP-03`). Un e-mail est envoyé à `exploitation@belespoir-export.be` et une tâche de planification est créée. |

## TC-US2-08 — Le montant de l'Opportunité est synchronisé depuis le devis (AC2.1)

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Positif |
| **Préconditions** | Opportunité sans montant estimé (`estimatedAmount: null`) |
| **Étapes** | 1. `POST /api/quotes` avec `price: 1200` <br> 2. `GET /api/opportunities/:id` |
| **Résultat attendu** | `estimatedAmount` de l'opportunité vaut `1200`, sans action manuelle. |

## TC-US2-09 — Anti-double-commande : blocage sur une opportunité déjà gagnée (AC2.3)

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Négatif |
| **Préconditions** | Un devis a déjà été converti avec succès sur l'opportunité (TC-US2-01), qui est donc `phase: "Clôture"` / `status: "Gagnée"` |
| **Étapes** | 1. `POST /api/quotes` avec le même `opportunityId` |
| **Résultat attendu** | Code `409`. Réponse contient `"error": "OPPORTUNITY_ALREADY_WON"`. Aucun nouveau devis créé. Le même contrôle s'applique sur `POST /api/quotes/:id/convert` si un devis existait déjà avant la clôture de l'opportunité. |

## TC-US2-02 — Refus de conversion si le devis n'est pas encore accepté

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Négatif |
| **Préconditions** | Devis créé, statut encore `"Envoyé"` |
| **Étapes** | 1. `POST /api/quotes/:id/convert` |
| **Résultat attendu** | Code `409`. Réponse contient `"error": "QUOTE_NOT_ACCEPTED"`. Aucune commande créée, opportunité inchangée. |

## TC-US2-03 — Refus de conversion si la preuve d'accord n'est pas jointe

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Négatif |
| **Préconditions** | Devis avec `status: "Accepté par le client"` mais `proofAttached: false` |
| **Étapes** | 1. `PATCH` statut sans `proofAttached` <br> 2. `POST /api/quotes/:id/convert` |
| **Résultat attendu** | Code `409`. Réponse contient `"error": "PROOF_MISSING"`. Aucune commande créée. |

## TC-US2-04 — Devis expiré ne peut plus être converti

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Négatif / limite |
| **Préconditions** | Devis dont `expiresAt` est dépassé, jamais accepté |
| **Étapes** | 1. Attendre/simuler le dépassement de `expiresAt` <br> 2. `POST /api/quotes/:id/convert` |
| **Résultat attendu** | Code `409`. Réponse contient `"error": "QUOTE_EXPIRED"`. Le devis passe automatiquement à `"Expiré"`. |
| **Note** | Testable de façon déterministe (sans attendre) en créant le devis avec `validityDays: -1` : `expiresAt` est alors déjà dans le passé dès la création. Voir `TC-E2E-02` et le scénario `@TC-E2E-02` de `e2e.feature`. |

## TC-US2-05 — Devis introuvable

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Négatif |
| **Données de test** | ID de devis inexistant, ex. `DEV-2026-9999` |
| **Étapes** | 1. `POST /api/quotes/DEV-2026-9999/convert` |
| **Résultat attendu** | Code `404`. Réponse contient `"error": "NOT_FOUND"`. |

## TC-US2-06 — Rejet si l'Opportunité référencée n'existe pas

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Négatif |
| **Données de test** | `opportunityId: "OPP-9999"` (inexistant) |
| **Étapes** | 1. `POST /api/quotes` |
| **Résultat attendu** | Code `404`. Réponse contient `"error": "NOT_FOUND"`. |

## TC-US2-07 — Lecture des commandes créées

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Positif |
| **Préconditions** | Au moins une commande créée (TC-US2-01) |
| **Étapes** | 1. `GET /api/orders` |
| **Résultat attendu** | Code `200`, tableau JSON des commandes, la plus récente en premier. |
