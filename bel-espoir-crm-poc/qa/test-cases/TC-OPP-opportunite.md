# Cas de test — Opportunité

**Fonctionnalité liée :** gestion d'une Opportunité liée à un Compte, avec phases
Qualification → Développement → Proposition → Clôture.
**Endpoints testés :** `POST /api/opportunities`, `GET /api/opportunities`, `PATCH /api/opportunities/:id`
**Automatisé (partiellement) :** voir `qa/automation/test.sh`

---

## TC-OPP-01 — Création automatique via qualification d'un Prospect

| Champ | Détail |
|---|---|
| **Priorité** | Critique |
| **Type** | Positif |
| **Préconditions** | Qualification d'un Prospect réussie (TC-LEAD-QUAL-01) |
| **Résultat attendu** | Opportunité créée avec `phase: "Qualification"`, `status: "Ouverte"`, liée au Compte et au Prospect d'origine (`leadId`). |

## TC-OPP-02 — Rejet d'une phase invalide

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Négatif |
| **Données de test** | `{ "phase": "Phase inexistante" }` |
| **Étapes** | 1. `PATCH /api/opportunities/:id` |
| **Résultat attendu** | Code `400`. Réponse contient `"error": "VALIDATION_ERROR"` et la liste des phases valides. |

## TC-OPP-03 — Passage automatique en phase Clôture / statut Gagnée

| Champ | Détail |
|---|---|
| **Priorité** | Critique |
| **Type** | Positif |
| **Préconditions** | Devis lié à l'opportunité, accepté, preuve jointe |
| **Étapes** | 1. `POST /api/quotes/:id/convert` |
| **Résultat attendu** | L'opportunité liée passe automatiquement à `phase: "Clôture"` et `status: "Gagnée"` (sans action manuelle). |

## TC-OPP-04 — Création manuelle d'une Opportunité (hors qualification de prospect)

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Positif |
| **Préconditions** | Un Compte existe déjà |
| **Données de test** | `accountId: "<ID compte>"`, `topic: "Renouvellement contrat annuel"`, `estimatedAmount: 15000` |
| **Étapes** | 1. `POST /api/opportunities` |
| **Résultat attendu** | Code `201`. Opportunité créée avec `phase: "Qualification"`, `leadId: null` (pas issue d'un prospect). |

## TC-OPP-05 — Rejet si le Compte référencé n'existe pas

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Négatif |
| **Données de test** | `accountId: "ACC-9999"` (inexistant) |
| **Étapes** | 1. `POST /api/opportunities` |
| **Résultat attendu** | Code `404`. Réponse contient `"error": "NOT_FOUND"`. |

## TC-OPP-06 — Progression manuelle des phases dans l'interface

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Positif |
| **Étapes** | 1. Sur la fiche Opportunité, cliquer "Phase suivante ▶" successivement |
| **Résultat attendu** | La phase avance dans l'ordre : Qualification → Développement → Proposition → Clôture, sans pouvoir sauter d'étape ni revenir en arrière via ce bouton. |
