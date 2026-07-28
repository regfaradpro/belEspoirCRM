# Suite Playwright — tests UI (front-end)

Contrairement à `qa/automation/test.sh` et à la suite BDD Cucumber (`qa/automation/bdd/`),
qui appellent l'API directement, ces tests pilotent **réellement l'interface web**
(`app/public/index.html`) dans un navigateur : navigation, remplissage de formulaires,
clics sur les boutons d'action. Ils servent à la fois de tests de non-régression UI et
de démo visuelle des cas de test (succès **et** échec) — trace/rapport à l'appui.

## Scénarios couverts

| Fichier | Cas de test |
|---|---|
| `tests/us1_lead.spec.js` | TC-US1-01/02/03 (Lead : création, champ manquant, doublon e-mail) |
| `tests/us2_quote_order.spec.js` | TC-US2-01/02/03 (Devis→Commande : conversion, non accepté, preuve manquante) |
| `tests/us3_case_sla.spec.js` | TC-US3-01/02/03 (Case/SLA : résolution, dépassement+escalade, sans commande) |
| `tests/e2e.spec.js` | TC-E2E-01/02 (parcours complet réussi / devis expiré) |

La préparation des données (reset, création de prérequis comme un Compte/une
Opportunité) passe par l'API (`request`) pour rester rapide et fiable ; l'action
réellement testée et les assertions passent par l'interface (`page`), pour un vrai test
front-end. Voir `tests/support.js`.

## Installation (une seule fois)

```bash
cd qa/automation/playwright
npm install
npx playwright install chromium
```

`npx playwright install chromium` télécharge le navigateur Chromium utilisé par les
tests (~270 Mo) — nécessite une connexion internet et un peu d'espace disque libre.

## Exécuter les tests

Le serveur `app/` **n'a pas besoin d'être démarré à l'avance** : `playwright.config.js`
le lance automatiquement si besoin (`webServer`), ou réutilise celui déjà en cours
d'exécution sur `http://localhost:3000`.

```bash
cd qa/automation/playwright
npx playwright test
```

Résultat attendu : **11 passed**.

### Voir les tests s'exécuter en direct (démo)

```bash
npx playwright test --headed
```

Ouvre une vraie fenêtre de navigateur et joue chaque scénario sous vos yeux (créer un
prospect, le qualifier, créer/convertir un devis, créer/résoudre un dossier…).

Pour ralentir l'exécution et mieux suivre visuellement :
```bash
npx playwright test --headed --workers=1 --project=chromium -- --slow-mo=500
```
(ou ajouter `use: { launchOptions: { slowMo: 500 } }` dans `playwright.config.js`.)

### Rapport HTML et traces (démo après coup)

Chaque exécution génère un rapport HTML et une trace par test (timeline avec
snapshots DOM, réseau, console — un vrai "rejouable" visuel, comme une vidéo pas-à-pas) :

```bash
npx playwright show-report report
```

Ouvre le rapport dans le navigateur ; cliquer sur **"View Trace"** à côté d'un test
ouvre le Trace Viewer et permet de rejouer chaque action, avant/après, capture d'écran
à l'appui.

### Lancer un seul fichier ou un seul scénario

```bash
npx playwright test tests/us3_case_sla.spec.js
npx playwright test -g "TC-E2E-02"
```

## Nettoyage

`test-results/` et `report/` sont régénérés à chaque exécution et ignorés par git
(voir `.gitignore` à la racine). Vous pouvez les supprimer sans risque entre deux
sessions de test :

```bash
rm -rf test-results report
```

⚠️ Ces dossiers peuvent contenir des vidéos (sur échec) et des traces (systématiques) —
sur une machine avec peu d'espace disque libre, pensez à les nettoyer régulièrement
plutôt que de laisser plusieurs exécutions s'accumuler.

## En cas de problème

| Problème | Solution |
|---|---|
| `Executable doesn't exist` / navigateur introuvable | Relancer `npx playwright install chromium` |
| Le port 3000 est déjà utilisé par une autre instance du serveur | Pas grave : `reuseExistingServer: true` dans `playwright.config.js` réutilise le serveur déjà démarré |
| `ENOSPC: no space left on device` pendant l'exécution | Le disque est plein (vidéos/traces des exécutions précédentes) — supprimer `test-results/`, `report/`, et vider le cache npm (`npm cache clean --force`) |
| Un test échoue sur un champ en lecture seule (Statut, Propriétaire…) | Ces champs sont des `<input disabled>` : leur valeur vit dans l'attribut `value`, pas dans le texte visible — utiliser le helper `readonlyField()` de `tests/support.js` avec `toHaveValue()`, pas `toContainText()` |
