# Cas de test — Qualification du Prospect (Business Process Flow)

**Fonctionnalité liée :** Business Process Flow du Prospect — étape "Qualifier" → "Développer".
La qualification transforme un Prospect en Compte + Opportunité, comme le fait Dynamics 365 nativement.
**Endpoint testé :** `POST /api/leads/:id/qualify`
**Automatisé :** voir `qa/automation/test.sh`

---

## TC-LEAD-QUAL-01 — Qualification réussie

| Champ | Détail |
|---|---|
| **Priorité** | Critique |
| **Type** | Positif |
| **Préconditions** | Prospect existant, `bpfStage: "Qualifier"`, avec au moins un e-mail ou téléphone renseigné |
| **Étapes** | 1. `POST /api/leads/:id/qualify` |
| **Résultat attendu** | Code `201`. Réponse contient `"message": "Prospect qualifié : Compte et Opportunité créés"`. Le prospect passe à `status: "Qualifié"` et `bpfStage: "Développer"` (étape 2 du BPF, débloquée). Un Compte et une Opportunité (phase `"Qualification"`) sont créés et liés au prospect d'origine. Une tâche "Développer l'opportunité" est créée. |

## TC-LEAD-QUAL-02 — Double qualification refusée

| Champ | Détail |
|---|---|
| **Priorité** | Haute |
| **Type** | Négatif |
| **Préconditions** | Prospect déjà qualifié (TC-LEAD-QUAL-01) |
| **Étapes** | 1. Rejouer `POST /api/leads/:id/qualify` |
| **Résultat attendu** | Code `409`. Réponse contient `"error": "ALREADY_QUALIFIED"`. Aucun second Compte/Opportunité créé. |

## TC-LEAD-QUAL-03 — Qualification refusée sans moyen de contact

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Négatif |
| **Préconditions** | Prospect créé sans `email`, `businessPhone` ni `mobilePhone` |
| **Étapes** | 1. `POST /api/leads/:id/qualify` |
| **Résultat attendu** | Code `400`. Réponse contient `"error": "VALIDATION_ERROR"` — un moyen de contact est requis avant de qualifier. |

## TC-LEAD-QUAL-04 — Étape 2 du BPF verrouillée avant qualification

| Champ | Détail |
|---|---|
| **Priorité** | Moyenne |
| **Type** | Positif (contrôle d'interface) |
| **Préconditions** | Prospect non qualifié (`bpfStage: "Qualifier"`) |
| **Étapes** | 1. Ouvrir la fiche du prospect dans l'interface mock |
| **Résultat attendu** | La barre de processus affiche l'étape "1. Qualifier" active et "2. Développer" grisée/verrouillée. Le bouton "✓ Qualifier" est visible ; aucun accès direct à la phase Opportunité n'est possible avant qualification. |
