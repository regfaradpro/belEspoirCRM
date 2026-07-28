# QA — Bel Espoir Export CRM POC

Ce dossier regroupe tous les artefacts de test du projet : cas de test documentés,
scripts d'automatisation (shell + BDD), et guide d'installation pour un testeur.

## Structure

```
qa/
├── test-cases/               Cas de test documentés (un fichier par entité/User Story)
│   ├── TC-ACC-account.md
│   ├── TC-US1-lead.md
│   ├── TC-LEAD-QUAL-bpf.md
│   ├── TC-OPP-opportunite.md
│   ├── TC-US2-devis-commande.md
│   └── TC-US3-reclamation-sla.md
├── automation/
│   ├── test.sh                  Script shell (curl), 18 vérifications end-to-end PASS/FAIL
│   ├── postman_collection.json   Collection Postman équivalente, avec chaînage de variables
│   ├── bdd/                      Suite BDD Gherkin (Cucumber.js, tests API) — voir ci-dessous
│   └── playwright/                Suite Playwright (tests UI, pilote le navigateur) — voir
│                                  `playwright/README.md`
└── TESTER_GUIDE.md            Guide d'installation pas à pas pour un testeur
```

## Traçabilité

| Entité / User Story | Critères d'acceptance | Cas de test | Endpoints testés |
|---|---|---|---|
| Compte (Account) | — | `TC-ACC-account.md` | `POST/GET /api/accounts`, `PATCH /api/accounts/:id` |
| US1 — Prospect (Lead) | AC1.1 (champs obligatoires), AC1.2 (doublon e-mail/téléphone/TVA), AC1.3 (assignation automatique) | `TC-US1-lead.md` | `POST/GET /api/leads` |
| Qualification (BPF Qualifier→Développer) | — | `TC-LEAD-QUAL-bpf.md` | `POST /api/leads/:id/qualify` |
| Opportunité | — | `TC-OPP-opportunite.md` | `POST/GET /api/opportunities`, `PATCH /api/opportunities/:id` |
| US2 — Devis → Commande | AC2.1 (conversion + montant synchronisé), AC2.2 (blocage sans acceptation), AC2.3 (blocage sans preuve + anti-double-commande) | `TC-US2-devis-commande.md` | `POST /api/quotes`, `PATCH /api/quotes/:id`, `POST /api/quotes/:id/convert` |
| US3 — Réclamation & SLA | AC3.1 (rattachement obligatoire), AC3.2 (SLA automatique), AC3.3 (escalade 2 niveaux) | `TC-US3-reclamation-sla.md` | `POST /api/cases`, `POST /api/cases/:id/resolve`, `POST /api/cases/:id/check-sla` |

Chaque cas de test suit le même gabarit : Priorité, Type (Positif/Négatif/Limite),
Préconditions, Données de test, Étapes, Résultat attendu.

**Chaîne de bout en bout couverte** : création d'un Prospect → qualification (crée
automatiquement le Compte + l'Opportunité, comme Dynamics 365) → devis lié à
l'Opportunité (montant synchronisé) → conversion en Commande (l'Opportunité passe en
phase Clôture/Gagnée) → réclamation liée à la Commande → résolution avec SLA et
escalade automatique en cas de dépassement.

## Exécuter les tests

1. Démarrer l'application (voir `TESTER_GUIDE.md` pour l'installation complète) :
   ```
   cd app
   npm install
   npm start
   ```
2. Dans un **second terminal**, lancer la suite shell rapide :
   ```
   cd qa/automation
   bash test.sh
   ```
   Le script réinitialise les données, exécute 18 vérifications (positives et
   négatives) et affiche un résumé `✅ PASS` / `❌ FAIL` avec le détail des échecs.

3. Ou lancer la suite BDD Gherkin (plus détaillée, avec cas de succès **et** d'échec
   explicitement nommés par scénario) :
   ```
   cd qa/automation/bdd
   npm install
   npx cucumber-js
   ```
   11 scénarios / 72 steps, couvrant `@TC-US1-01/02/03`, `@TC-US2-01/02/03`,
   `@TC-US3-01/02/03` et `@TC-E2E-01/02` (fichiers `.feature` dans `bdd/features/`).

4. Ou lancer la suite Playwright, qui pilote réellement l'interface web dans un
   navigateur (démo visuelle des scénarios, succès et échec) :
   ```
   cd qa/automation/playwright
   npm install
   npx playwright install chromium   # première fois seulement
   npx playwright test               # démarre app/ automatiquement si besoin
   ```
   11 tests couvrant les mêmes `@TC-US1/US2/US3/E2E`, mais en cliquant réellement dans
   l'écran (formulaires, boutons, panneau de détail). Ajouter `--headed` pour voir le
   navigateur s'exécuter en direct, ou `npx playwright show-report report` pour rejouer
   une exécution après coup (trace pas-à-pas). Détails : `automation/playwright/README.md`.

5. Alternative avec Postman : importer `automation/postman_collection.json` et exécuter
   les dossiers `US1`, `US2`, `US3` dans l'ordre.

6. Documentation interactive de l'API (OpenAPI/Swagger), une fois le serveur démarré :
   **http://localhost:3000/api-docs**

## Ce que couvre l'automatisation vs. les tests manuels

- **Automatisé au niveau API (`test.sh` / BDD Cucumber / Postman)** : tous les scénarios
  "chemin heureux" et les validations d'erreur, y compris désormais l'expiration de
  devis (`validityDays: -1`, testable sans attendre) et le dépassement/l'escalade de
  SLA (`openedHoursAgo` + `POST /api/cases/:id/check-sla`, testables sans attendre).
- **Automatisé au niveau UI (Playwright)** : les mêmes scénarios clés, mais en pilotant
  réellement l'écran — utile en démo et pour détecter les régressions visuelles/de
  câblage des boutons que les tests API seuls ne verraient pas.
- **Manuel uniquement** : contrôles visuels fins non couverts par Playwright (BPF,
  tableau de bord) — voir `TC-LEAD-QUAL-04` et `TC-OPP-06`.

## Persistance des données

Les données ne sont plus uniquement en mémoire : elles sont sauvegardées dans
`app/data/db.json` après chaque mutation et rechargées au démarrage du serveur
(fichier ignoré par git — ne contient que des données fictives de test). Le bouton
"↺ Réinitialiser les données" (ou `POST /api/reset`) reste le moyen de repartir de zéro.
