/**
 * Persistance simple sur fichier JSON.
 * Remplace le stockage 100% en mémoire : les données survivent au redémarrage
 * du serveur (app/data/db.json), sans dépendance à une vraie base de données.
 * Ce fichier ne contient que des données fictives de démonstration/test.
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

function loadDb(initialDb, initialCounters) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      return {
        db: Object.assign({}, initialDb, raw.db),
        counters: Object.assign({}, initialCounters, raw.counters),
      };
    }
  } catch (e) {
    console.error("⚠️  Impossible de charger app/data/db.json, démarrage avec des données vides :", e.message);
  }
  return { db: initialDb, counters: initialCounters };
}

function saveDb(db, counters) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({ db, counters }, null, 2));
  } catch (e) {
    console.error("⚠️  Échec de sauvegarde de app/data/db.json :", e.message);
  }
}

module.exports = { loadDb, saveDb, DATA_FILE };
