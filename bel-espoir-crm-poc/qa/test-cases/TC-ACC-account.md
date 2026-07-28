# Cas de test — Compte (Account)

**Fonctionnalité liée :** création et gestion d'un Compte client, onglets Résumé et Profil de la société
**Endpoints testés :** `POST /api/accounts`, `GET /api/accounts`, `GET /api/accounts/:id`, `PATCH /api/accounts/:id`
**Automatisé (partiellement) :** voir `qa/automation/test.sh`

---

## TC-ACC-01 — Création d'un Compte valide

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Positif |
| **Données de test** | `name: "Entrepôts Meunier SPRL"`, `phone: "+3265998877"` |
| **Étapes** | 1. `POST /api/accounts` |
| **Résultat attendu** | Code `201`. Compte créé avec un identifiant `ACC-000x`. |

## TC-ACC-02 — Rejet si le nom du compte est manquant

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Négatif |
| **Données de test** | `{}` (aucun champ) |
| **Étapes** | 1. `POST /api/accounts` |
| **Résultat attendu** | Code `400`. Réponse contient `"error": "VALIDATION_ERROR"` — le nom du compte est obligatoire (onglet Résumé). |

## TC-ACC-03 — Onglet Profil de la société renseigné

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Positif |
| **Données de test** | `sector: "Transport routier"`, `naceCode: "49.41"`, `ownership: "Privée"`, `annualRevenue: 1200000`, `numberOfEmployees: 18`, `description: "PME familiale spécialisée fret régional"` |
| **Étapes** | 1. `PATCH /api/accounts/:id` avec les champs ci-dessus |
| **Résultat attendu** | Code `200`. Le compte reflète les valeurs mises à jour dans l'onglet "Profil de la société". |

## TC-ACC-04 — Compte créé automatiquement via qualification d'un Prospect

| Champ | Détail |
|---|---|
| **Priorité** | Critique |
| **Type** | Positif |
| **Préconditions** | Un Prospect valide existe (voir `TC-US1-lead.md`) |
| **Étapes** | 1. `POST /api/leads/:id/qualify` |
| **Résultat attendu** | Un nouveau Compte est créé automatiquement, avec `name` = société du prospect, `primaryContactName` = prénom + nom du contact, `vatNumber` = n° de TVA du prospect (si renseigné), et `originatingLeadId` renseigné (champ "Prospect d'origine" du bloc Marketing). Voir `TC-LEAD-QUAL.md`. |

## TC-ACC-05 — Lecture de la liste des Comptes

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Positif |
| **Étapes** | 1. `GET /api/accounts` |
| **Résultat attendu** | Code `200`, tableau JSON des Comptes, le plus récent en premier. |
