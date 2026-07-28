# Guide de démarrage — Testeur

Ce guide explique comment installer et lancer le POC CRM Bel Espoir Export en local,
étape par étape, sans connaissances techniques avancées.

## Prérequis (à installer une seule fois)

1. **Node.js** (version 18 ou plus récente)
   - Télécharger sur https://nodejs.org (choisir la version "LTS")
   - Vérifier l'installation : ouvrir un terminal et taper :
     ```
     node -v
     ```
     Un numéro de version doit s'afficher (ex: v20.11.0).

2. **Un éditeur de code** (optionnel, pour lire les fichiers)
   - VS Code recommandé : https://code.visualstudio.com

3. **Postman** (optionnel, si vous voulez tester avec la collection fournie)
   - https://www.postman.com/downloads

## Étape 1 — Récupérer le projet

1. Décompresser le fichier `bel-espoir-crm-poc.zip` reçu, où vous le souhaitez (ex: Bureau).
2. Ouvrir un terminal :
   - **Windows** : clic droit dans le dossier → "Ouvrir dans le terminal"
   - **Mac** : ouvrir l'app "Terminal", puis taper `cd ` et glisser le dossier dans la fenêtre
3. Se placer dans le dossier de l'application :
   ```
   cd app
   ```
   Vous devez voir `server.js`, `package.json`, `public/`, etc. (`ls` pour vérifier)

## Étape 2 — Installer les dépendances

Toujours dans `app/`, taper :
```
npm install
```
Cela télécharge les librairies nécessaires (une seule fois, prend ~30 secondes).

## Étape 3 — Lancer le projet

Toujours dans `app/` :
```
npm start
```
Vous devez voir s'afficher :
```
✅ Mock CRM Bel Espoir Export démarré : http://localhost:3000
```
➡️ **Laisser ce terminal ouvert** pendant toute la durée des tests (fermer le terminal arrête l'application).

Les données sont désormais sauvegardées dans `app/data/db.json` : elles survivent à un
redémarrage du serveur (contrairement à une version précédente du mock). Utilisez le
bouton "↺ Réinitialiser les données" pour repartir de zéro à tout moment.

## Étape 4 — Tester

Deux façons de tester, au choix :

### A. Interface web (le plus simple)
1. Ouvrir un navigateur (Chrome, Firefox…)
2. Aller sur : **http://localhost:3000**
3. Utiliser la navigation latérale (Prospects, Opportunités, Comptes, Devis, Commandes,
   Dossiers) : cliquer une ligne ouvre la fiche dans un panneau latéral, à côté de la liste
4. Le bouton "📬 Notifications" affiche les e-mails et tâches générés automatiquement

### B. Postman (pour des tests API détaillés)
1. Ouvrir Postman
2. Cliquer **Import** → sélectionner le fichier `qa/automation/postman_collection.json`
3. Dérouler les dossiers `US1`, `US2`, `US3` et cliquer **Send** sur chaque requête, dans l'ordre indiqué

### C. Script automatisé (rapide, sans Postman)
Dans un **second terminal** (laisser le serveur tourner dans le premier) :
```
cd qa/automation
bash test.sh
```
Affiche un résumé PASS/FAIL pour les 18 scénarios clés.

### D. Suite BDD Gherkin (Cucumber.js)
Dans un **second terminal** (laisser le serveur tourner dans le premier), la première
fois seulement :
```
cd qa/automation/bdd
npm install
```
Puis, à chaque exécution :
```
npx cucumber-js
```
Affiche le détail de chaque scénario (succès **et** échec) pour US1, US2, US3 et le
parcours de bout en bout — voir les fichiers `.feature` dans `qa/automation/bdd/features/`.

### E. Suite Playwright (tests UI, avec démo visuelle)
Contrairement aux options C et D qui appellent l'API directement, ces tests pilotent
réellement l'interface web dans un navigateur. La première fois :
```
cd qa/automation/playwright
npm install
npx playwright install chromium
```
Puis, à chaque exécution (le serveur `app/` est démarré automatiquement si besoin) :
```
npx playwright test
```
Pour **voir les tests s'exécuter en direct** dans une vraie fenêtre de navigateur :
```
npx playwright test --headed
```
Pour rejouer une exécution après coup (rapport HTML + trace pas-à-pas) :
```
npx playwright show-report report
```
Détails complets : voir `qa/automation/playwright/README.md`.

### F. Documentation API interactive (Swagger)
Une fois le serveur démarré, ouvrir **http://localhost:3000/api-docs** pour consulter
et tester chaque endpoint directement depuis le navigateur.

### G. Cas de test détaillés
Le détail de chaque scénario (préconditions, données, résultat attendu) est documenté
dans `qa/test-cases/` — un fichier par entité/User Story.

## Réinitialiser les données

Pour repartir de zéro à tout moment (les données sont désormais sauvegardées sur
disque dans `app/data/db.json`, donc ce bouton est le seul moyen de les vider) :
- Dans l'interface web : bouton **"↺ Réinitialiser les données"** en haut à droite
- Ou dans Postman : dossier **Utilitaires** → **Reset data**

## En cas de problème

| Problème | Solution |
|---|---|
| `command not found: npm` | Node.js n'est pas installé — voir Prérequis |
| `EADDRINUSE: address already in use :3000` | L'app tourne déjà — fermer les autres terminaux ou redémarrer l'ordinateur |
| La page ne s'affiche pas | Vérifier que le terminal affiche bien "démarré" et que l'URL est `http://localhost:3000` (pas https) |
| Rien ne se passe en cliquant sur les boutons | Vérifier que le terminal est toujours ouvert et n'affiche pas d'erreur rouge |

## Pour arrêter l'application

Dans le terminal, appuyer sur **Ctrl + C**.
