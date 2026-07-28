#!/bin/bash
# Test script — Mock CRM Bel Espoir Export (structure Dynamics 365 réelle)
# Usage: avec le serveur lancé (npm start dans app/), exécuter :
#   bash test.sh
# Parcourt la chaîne complète : Prospect -> Qualification -> Compte + Opportunité
# -> Devis -> Commande -> Dossier -> Résolution, avec les cas positifs et négatifs.

BASE="http://localhost:3000/api"
PASS=0
FAIL=0

check() {
  local label="$1"; local expect="$2"; local response="$3"
  if echo "$response" | grep -q "$expect"; then
    echo "✅ PASS - $label"; PASS=$((PASS+1))
  else
    echo "❌ FAIL - $label"; echo "   -> $response"; FAIL=$((FAIL+1))
  fi
}
extract() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log($1)}catch(e){console.log('')}})"; }

echo "== Reset data =="
curl -s -X POST $BASE/reset > /dev/null

echo ""
echo "===== Compte (Account) ====="
R=$(curl -s -X POST $BASE/accounts -H "Content-Type: application/json" -d '{"name":"Entrepôts Meunier SPRL","phone":"+3265998877"}')
check "TC-ACC-01 Compte créé avec succès" "ACC-000" "$R"

R=$(curl -s -X POST $BASE/accounts -H "Content-Type: application/json" -d '{}')
check "TC-ACC-02 Nom du compte obligatoire" "VALIDATION_ERROR" "$R"

echo ""
echo "===== Prospect (Lead) ====="

R=$(curl -s -X POST $BASE/leads -H "Content-Type: application/json" -d '{
  "topic":"Demande de transport de fret régulier","firstName":"Marc","lastName":"Durand",
  "email":"contact@transports-durand.be","businessPhone":"+3265123456",
  "company":"Transports Durand SPRL","city":"Mons"}')
check "TC-US1-01 Lead créé avec succès (BPF = Qualifier)" "\"bpfStage\":\"Qualifier\"" "$R"
LID=$(echo "$R" | extract "JSON.parse(d).lead.id")

R=$(curl -s -X POST $BASE/leads -H "Content-Type: application/json" -d '{"lastName":"Julie"}')
check "TC-US1-02 Champs obligatoires manquants rejetés" "VALIDATION_ERROR" "$R"

R=$(curl -s -X POST $BASE/leads -H "Content-Type: application/json" -d '{
  "topic":"Doublon test","lastName":"Durand","company":"Transports Durand SPRL","email":"contact@transports-durand.be"}')
check "TC-US1-03 Doublon détecté (même e-mail)" "DUPLICATE_LEAD" "$R"

echo ""
echo "===== Qualification du Prospect (Business Process Flow) ====="

R=$(curl -s -X POST $BASE/leads/$LID/qualify)
check "TC-LEAD-QUAL-01 Qualification réussie -> Compte + Opportunité créés" "Compte et Opportunité créés" "$R"
OPPID=$(echo "$R" | extract "JSON.parse(d).opportunity.id")
ACCID=$(echo "$R" | extract "JSON.parse(d).account.id")

R=$(curl -s -X POST $BASE/leads/$LID/qualify)
check "TC-LEAD-QUAL-02 Double qualification refusée" "ALREADY_QUALIFIED" "$R"

echo ""
echo "===== Opportunité ====="

R=$(curl -s localhost:3000/api/opportunities/$OPPID)
check "TC-OPP-01 Opportunité créée en phase Qualification" "\"phase\":\"Qualification\"" "$R"

R=$(curl -s -X PATCH $BASE/opportunities/$OPPID -H "Content-Type: application/json" -d '{"phase":"Phase inexistante"}')
check "TC-OPP-02 Phase invalide rejetée" "VALIDATION_ERROR" "$R"

echo ""
echo "===== US2 — Devis -> Commande ====="

R=$(curl -s -X POST $BASE/quotes -H "Content-Type: application/json" -d "{\"opportunityId\":\"$OPPID\",\"client\":\"Transports Durand SPRL\",\"trajet\":\"Mons -> Charleroi\",\"price\":850}")
check "Devis créé, lié à l'opportunité" "DEV-2026" "$R"
QID=$(echo "$R" | extract "JSON.parse(d).id")

R=$(curl -s -X POST $BASE/quotes/$QID/convert)
check "TC-US2-02 Conversion refusée avant acceptation" "QUOTE_NOT_ACCEPTED" "$R"

curl -s -X PATCH $BASE/quotes/$QID -H "Content-Type: application/json" -d '{"status":"Accepté par le client"}' > /dev/null
R=$(curl -s -X POST $BASE/quotes/$QID/convert)
check "TC-US2-03 Conversion refusée sans preuve jointe" "PROOF_MISSING" "$R"

curl -s -X PATCH $BASE/quotes/$QID -H "Content-Type: application/json" -d '{"proofAttached":true}' > /dev/null
R=$(curl -s -X POST $BASE/quotes/$QID/convert)
check "TC-US2-01 Conversion réussie en commande" "converti en commande" "$R"
OID=$(echo "$R" | extract "JSON.parse(d).order.id")

R=$(curl -s localhost:3000/api/opportunities/$OPPID)
check "TC-OPP-03 Opportunité passe en phase Clôture / Gagnée après conversion" "\"phase\":\"Clôture\"" "$R"

echo ""
echo "===== US3 — Réclamation & SLA ====="

R=$(curl -s -X POST $BASE/cases -H "Content-Type: application/json" -d '{"category":"Facturation"}')
check "TC-US3-03 Réclamation refusée sans commande" "VALIDATION_ERROR" "$R"

R=$(curl -s -X POST $BASE/cases -H "Content-Type: application/json" -d "{\"orderId\":\"$OID\",\"category\":\"Dommage marchandise\"}")
check "TC-US3-01 Réclamation créée avec SLA (24h)" "\"slaHours\":24" "$R"
CID=$(echo "$R" | extract "JSON.parse(d).id")

R=$(curl -s -X POST $BASE/cases/$CID/resolve)
check "TC-US3-02 Résolution + notification envoyée" "Dossier résolu" "$R"

R=$(curl -s -X POST $BASE/cases/$CID/resolve)
check "TC-US3-04 Double résolution refusée" "ALREADY_RESOLVED" "$R"

echo ""
echo "===================================="
echo "Résultat : $PASS réussis / $FAIL échoués"
echo "===================================="
