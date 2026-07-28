# Cas de test — US3 : Réclamation client & SLA

**Fonctionnalité liée :** création et suivi d'une réclamation (Case) rattachée à une commande
**Critères d'acceptance couverts :** AC3.1 (rattachement obligatoire), AC3.2 (SLA automatique
par catégorie), AC3.3 (escalade automatique à 2 niveaux au dépassement du SLA — alerte
service client, puis alerte direction si non résolu 24h après)
**Endpoints testés :** `POST /api/cases`, `POST /api/cases/:id/resolve`,
`POST /api/cases/:id/check-sla`
**Automatisé :** voir `qa/automation/test.sh` et la suite BDD
`qa/automation/bdd/features/us3_case_sla.feature` (scénarios `@TC-US3-01/02/03`, succès et échec)

---

## TC-US3-01 — Création d'une réclamation valide avec calcul automatique du SLA

| Champ | Détail |
|---|---|
| **Priorité** | Critique |
| **Type** | Positif |
| **Préconditions** | Une commande existante (voir TC-US2-01 pour obtenir un `orderId`) |
| **Données de test** | `orderId: "<ID commande existante>"`, `category: "Dommage marchandise"` |
| **Étapes** | 1. `POST /api/cases` avec les données ci-dessus |
| **Résultat attendu** | Code `201`. Dossier créé avec `status: "Ouvert"`, `slaHours: 24`, `dueAt` calculé à +24h. |

## TC-US3-02 — Résolution d'une réclamation dans les délais du SLA

| Champ | Détail |
|---|---|
| **Priorité** | Critique |
| **Type** | Positif |
| **Préconditions** | Réclamation ouverte (TC-US3-01), résolution avant `dueAt` |
| **Étapes** | 1. `POST /api/cases/:id/resolve` |
| **Résultat attendu** | Code `200`. `status: "Résolu"`, `slaBreached: false`. Un e-mail de résolution et une enquête de satisfaction sont envoyés au client (visibles via `GET /api/notifications`). |

## TC-US3-03 — Rejet si aucune commande n'est associée

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Négatif |
| **Données de test** | `{ "category": "Facturation" }` (sans `orderId`) |
| **Étapes** | 1. `POST /api/cases` |
| **Résultat attendu** | Code `400`. Réponse contient `"error": "VALIDATION_ERROR"` et un message précisant qu'une commande est requise. |

## TC-US3-04 — Rejet si la commande référencée n'existe pas

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Négatif |
| **Données de test** | `orderId: "CMD-2026-9999"` (inexistant), `category: "Retard"` |
| **Étapes** | 1. `POST /api/cases` |
| **Résultat attendu** | Code `404`. Réponse contient `"error": "NOT_FOUND"`. |

## TC-US3-05 — Rejet si la catégorie est invalide ou manquante

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Négatif |
| **Données de test** | `orderId` valide, `category: "Catégorie inexistante"` |
| **Étapes** | 1. `POST /api/cases` |
| **Résultat attendu** | Code `400`. Réponse contient `"error": "VALIDATION_ERROR"` listant les catégories valides (`Retard`, `Dommage marchandise`, `Facturation`, `Autre`). |

## TC-US3-06 — SLA différencié selon la catégorie

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Positif |
| **Données de test** | Créer 4 réclamations, une par catégorie |
| **Étapes** | 1. `POST /api/cases` pour chaque catégorie : `Dommage marchandise`, `Retard`, `Facturation`, `Autre` |
| **Résultat attendu** | `slaHours` respectivement : `24`, `48`, `72`, `72`. |

## TC-US3-07 — Détection automatique du dépassement de SLA (escalade niveau 1)

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Positif / limite |
| **Préconditions** | Réclamation ouverte dont `dueAt` est dépassé sans résolution |
| **Étapes** | 1. Laisser une réclamation ouverte au-delà de son SLA (le serveur vérifie toutes les 10s en environnement de démo), ou appeler directement `POST /api/cases/:id/check-sla` pour une vérification immédiate <br> 2. `GET /api/cases` |
| **Résultat attendu** | Le dossier passe automatiquement à `status: "SLA dépassé"`, `slaBreached: true`, `escalationLevel: 1`. Une alerte est envoyée à `responsable.service-client@belespoir-export.be` (`GET /api/notifications`). |
| **Note** | Testable de façon déterministe (sans attendre) en créant la réclamation avec `openedHoursAgo` supérieur au SLA de la catégorie (ex. `openedHoursAgo: 50` pour un SLA de 24h/48h) : l'échéance est alors déjà dépassée à la création et évaluée immédiatement. Voir `@TC-US3-02` de `us3_case_sla.feature`. |

## TC-US3-09 — Escalade automatique niveau 2 (direction) après 24h supplémentaires (AC3.3)

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Positif / limite |
| **Préconditions** | Réclamation en `status: "SLA dépassé"` (`escalationLevel: 1`) depuis plus de 24h sans résolution |
| **Étapes** | 1. Créer la réclamation avec `openedHoursAgo` ≥ SLA de la catégorie + 24h (ex. `openedHoursAgo: 50` pour une catégorie à SLA 24h), ou attendre ce délai sur une réclamation réelle <br> 2. `POST /api/cases/:id/check-sla` (ou attendre le prochain cycle de vérification automatique, 10s en démo) |
| **Résultat attendu** | Le dossier passe à `status: "Escaladé - Direction"`, `escalationLevel: 2`. Une alerte est envoyée à `direction@belespoir-export.be` et une tâche "Escalade direction" est créée, assignée à "Direction Générale". |

## TC-US3-10 — Vérification manuelle du SLA sans attendre le cycle automatique

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Positif (utilitaire de test) |
| **Préconditions** | Réclamation ouverte, échéance dépassée |
| **Étapes** | 1. `POST /api/cases/:id/check-sla` |
| **Résultat attendu** | Code `200`. Le dossier réévalué est retourné avec son `status`/`escalationLevel` à jour, sans attendre le cycle de vérification périodique (10s en démo). Utilisé par l'UI (bouton "↻ Vérifier le SLA") et par la suite BDD. |

## TC-US3-08 — Double résolution refusée

| Champ | Détail |
|---|---|
| **Priorité** | Basse |
| **Type** | Négatif |
| **Préconditions** | Réclamation déjà résolue (TC-US3-02) |
| **Étapes** | 1. `POST /api/cases/:id/resolve` une seconde fois |
| **Résultat attendu** | Code `409`. Réponse contient `"error": "ALREADY_RESOLVED"`. |
