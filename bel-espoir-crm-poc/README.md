# POC — CRM Bel Espoir Export SCS (mock fidèle à l'instance Dynamics 365 sandbox)

Mock exécutable en local qui reproduit la structure réelle de l'instance Dynamics 365
(BE 0648.747.183 — transport routier de fret, déménagement, logistique) :

- **Compte (Account)** — onglets Résumé (Nom, Téléphone, Télécopie, Site Web, Contact
  principal) et Profil de la société (Secteur, Code NACE, Propriété, Revenu annuel,
  Nombre d'employés, Description, Préférences de contact).
- **Prospect (Lead)** — onglet Résumé avec tous les champs réels (Rubrique, Prénom, Nom,
  Fonction, téléphones, e-mail, Société, Site Web, adresse complète, Source, Classement,
  Statut, Propriétaire) + **Business Process Flow** en 2 étapes (Qualifier → Développer),
  la qualification créant automatiquement le Compte et l'Opportunité.
- **Opportunité** — liée à un Compte, phases Qualification → Développement →
  Proposition → Clôture.
- **Devis (Quote) → Commande (Order)** — devis lié à une Opportunité, conversion
  bloquée sans acceptation client + preuve d'accord jointe ; l'opportunité passe
  automatiquement en phase Clôture / statut Gagnée à la conversion.
- **Dossier (Case)** — réclamation liée à une Commande, SLA automatique par catégorie
  (24h/48h/72h), détection de dépassement, e-mail + enquête de satisfaction à la clôture.

Les données sont sauvegardées dans `app/data/db.json` (chargées au démarrage,
sauvegardées après chaque mutation) : elles survivent désormais au redémarrage du
serveur. C'est un mock pour dérouler et documenter les scénarios de test, pas un
système de production — la persistance réelle resterait à porter vers PostgreSQL/
Dataverse pour aller plus loin.

## Structure du repo

```
bel-espoir-crm-poc/
├── app/                        Application (serveur + interface web style D365)
│   ├── server.js
│   ├── package.json
│   └── public/index.html
└── qa/                         Tout ce qui concerne les tests
    ├── README.md                 Vue d'ensemble QA + traçabilité
    ├── TESTER_GUIDE.md            Guide d'installation pas à pas
    ├── test-cases/                Cas de test documentés (1 fichier / entité)
    └── automation/                Scripts d'exécution (test.sh, Postman, BDD, Playwright)
```

## Démarrage rapide

```bash
cd app
npm install
npm start
```

Puis ouvrir **http://localhost:3000** : interface avec barre de navigation latérale
(Prospects, Opportunités, Comptes, Devis, Commandes, Dossiers), grilles de liste et
fiches avec onglets/BPF fidèles à la structure réelle. Un panneau de notifications
(bouton en bas à droite) affiche les e-mails et tâches générés en temps réel.

Pour la marche à suivre complète (installation, configuration, tests) : voir
**[`qa/TESTER_GUIDE.md`](qa/TESTER_GUIDE.md)**.

## Tester

Voir **[`qa/README.md`](qa/README.md)** pour la structure QA complète et la
traçabilité des cas de test. En résumé :

- **Cas de test documentés** : `qa/test-cases/` (Compte, Prospect, Qualification/BPF,
  Opportunité, Devis→Commande, Réclamation/SLA — avec préconditions, données, résultat attendu)
- **Script automatisé** : `cd qa/automation && bash test.sh` (parcourt la chaîne complète
  Prospect → Qualification → Opportunité → Devis → Commande → Dossier, 18 vérifications PASS/FAIL)
- **Suite BDD Gherkin** : `cd qa/automation/bdd && npm install && npx cucumber-js`
  (11 scénarios / 72 steps, succès et échec, dont le parcours de bout en bout)
- **Suite Playwright (tests UI)** : `cd qa/automation/playwright && npm install && npx playwright install chromium && npx playwright test`
  (pilote réellement l'interface web ; ajouter `--headed` pour une démo visuelle en
  direct, ou `npx playwright show-report report` pour rejouer une exécution — voir
  `qa/automation/playwright/README.md`)
- **Collection Postman** : `qa/automation/postman_collection.json`
- **Documentation API interactive (OpenAPI/Swagger)** : http://localhost:3000/api-docs

## Parcours de bout en bout (chemin heureux)

1. `POST /api/leads` — créer un Prospect (BPF étape "Qualifier")
2. `POST /api/leads/:id/qualify` — qualifier → crée automatiquement un Compte + une Opportunité (BPF passe à "Développer")
3. `POST /api/quotes` — créer un devis lié à l'Opportunité
4. `PATCH /api/quotes/:id` — marquer accepté + preuve d'accord jointe
5. `POST /api/quotes/:id/convert` — convertir en Commande (l'Opportunité passe en phase Clôture / Gagnée)
6. `POST /api/cases` — créer une réclamation liée à la Commande (SLA calculé automatiquement)
7. `POST /api/cases/:id/resolve` — résoudre (e-mail + enquête de satisfaction envoyés)

## Points d'API

| Méthode | Route                        | Description                                       |
|---------|------------------------------|----------------------------------------------------|
| POST    | `/api/accounts`               | Créer un Compte                                    |
| GET     | `/api/accounts`, `/api/accounts/:id` | Lister / consulter les Comptes              |
| PATCH   | `/api/accounts/:id`           | Modifier un Compte (Profil de la société)          |
| POST    | `/api/leads`                   | Créer un Prospect                                  |
| GET     | `/api/leads`, `/api/leads/:id` | Lister / consulter les Prospects                  |
| POST    | `/api/leads/:id/qualify`       | Qualifier (BPF) → crée Compte + Opportunité       |
| POST    | `/api/opportunities`           | Créer une Opportunité                              |
| GET     | `/api/opportunities`, `/api/opportunities/:id` | Lister / consulter                |
| PATCH   | `/api/opportunities/:id`       | Modifier la phase / le montant                     |
| POST    | `/api/quotes`                  | Créer un devis (lié à une Opportunité)             |
| PATCH   | `/api/quotes/:id`              | Modifier statut / preuve jointe                     |
| POST    | `/api/quotes/:id/convert`      | Convertir en Commande                              |
| GET     | `/api/orders`                  | Lister les Commandes                               |
| POST    | `/api/cases`                   | Créer une réclamation (rattachée à une commande)   |
| POST    | `/api/cases/:id/resolve`       | Clôturer la réclamation                            |
| POST    | `/api/cases/:id/check-sla`     | Vérifier immédiatement le SLA/l'escalade (utilitaire de test) |
| GET     | `/api/notifications`, `/api/tasks` | Historique des notifications / tâches simulées |
| POST    | `/api/reset`                   | Réinitialiser toutes les données                   |

## Ce que le mock ne couvre pas (hors périmètre)

- Intégration comptable/facturation
- Application mobile chauffeur
- Migration des données historiques Excel
- Persistance de production (fichier JSON local pour l'instant — à porter vers
  PostgreSQL/Dataverse pour un vrai déploiement)
- Authentification / rôles de sécurité Dynamics 365

## Prochaine étape suggérée

Rejouer les cas de test de `qa/` via Newman en pipeline CI/CD, puis migrer
progressivement vers de vrais appels Dataverse Web API une fois connecté à
l'environnement Dynamics 365 sandbox réel.
