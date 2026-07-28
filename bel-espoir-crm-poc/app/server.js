/**
 * Mock CRM — Bel Espoir Export SCS
 * Simule fidèlement la structure de l'instance Dynamics 365 sandbox réelle :
 *   - Compte (Account)      : onglets Résumé + Profil de la société
 *   - Prospect (Lead)       : onglet Résumé + Business Process Flow (Qualifier -> Développer)
 *   - Opportunité           : liée à un Compte, phases Qualification -> Développement -> Proposition -> Clôture
 *   - Devis (Quote)         : lié à une Opportunité, statut + preuve d'accord
 *   - Commande (Order)      : générée à la conversion d'un devis accepté
 *   - Dossier (Case)        : réclamation avec SLA automatique par catégorie
 *
 * Stockage en mémoire (redémarre à zéro à chaque restart) — POC de test, pas de production.
 * Lancer : npm install && npm start   -> http://localhost:3000
 */

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { v4: uuid } = require("uuid");
const { loadDb, saveDb } = require("./persistence");
const openapiSpec = require("./openapi");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api-docs.json", (req, res) => res.json(openapiSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// ---------------------------------------------------------------------------
// "Base de données" — chargée depuis app/data/db.json si présent, sinon vide.
// Persistée sur fichier après chaque mutation (voir middleware plus bas) afin
// que les données survivent au redémarrage du serveur.
// ---------------------------------------------------------------------------
const { db, counters: loadedCounters } = loadDb(
  {
    accounts: [],
    leads: [],
    opportunities: [],
    quotes: [],
    orders: [],
    cases: [],
    tasks: [],
    notifications: [],
  },
  { account: 1, lead: 100, opp: 1, quote: 200, order: 200, case: 0 }
);
let counters = loadedCounters;

app.use((req, res, next) => {
  res.on("finish", () => {
    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method) && res.statusCode < 400) {
      saveDb(db, counters);
    }
  });
  next();
});

const now = () => new Date().toISOString();
const addDays = (date, days) => new Date(date.getTime() + days * 86400000);
const addHours = (date, hours) => new Date(date.getTime() + hours * 3600000);

function notify(channel, to, subject, body) {
  const n = { id: uuid(), channel, to, subject, body, sentAt: now() };
  db.notifications.unshift(n);
  return n;
}
function createTask(title, assignedTo, dueDate) {
  const t = { id: uuid(), title, assignedTo, dueDate: dueDate.toISOString(), createdAt: now() };
  db.tasks.unshift(t);
  return t;
}

// Répartition géographique simplifiée pour l'assignation automatique (AC Lead)
const ZONES = [
  { keyword: "mons", zone: "Hainaut", owner: "Sophie Renard" },
  { keyword: "charleroi", zone: "Hainaut", owner: "Sophie Renard" },
  { keyword: "la louvière", zone: "Hainaut", owner: "Sophie Renard" },
  { keyword: "bruxelles", zone: "Bruxelles", owner: "Julien Petit" },
  { keyword: "liège", zone: "Liège", owner: "Marc Delcourt" },
];
function assignOwner(city) {
  const c = (city || "").toLowerCase();
  const match = ZONES.find((z) => c.includes(z.keyword));
  return match || { zone: "Autre", owner: "Claire Moreau" };
}

const SLA_HOURS = { "Dommage marchandise": 24, Retard: 48, Facturation: 72, Autre: 72 };
// Délai supplémentaire après dépassement de SLA avant escalade au niveau direction
const ESCALATION_EXTRA_HOURS = 24;

// Normalise un n° de TVA belge pour comparaison (BE 0648.747.183 -> BE0648747183)
function normalizeVat(vat) {
  if (!vat) return null;
  return vat.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// COMPTE (Account)
// Onglet Résumé : Nom du compte*, Téléphone, Télécopie, Site Web, Contact principal
// Onglet Profil de la société : Secteur, Code NACE, Propriété, Revenu annuel,
//   Nombre d'employés, Description, Prospect d'origine, Préférences de contact
// ---------------------------------------------------------------------------
app.post("/api/accounts", (req, res) => {
  const { name, phone, fax, website, vatNumber, primaryContactName,
          sector, naceCode, ownership, annualRevenue, numberOfEmployees, description,
          originatingLeadId, preferredCommunication, allowEmail, allowBulkMail, allowPhone } = req.body;

  if (!name) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Le nom du compte est obligatoire" });
  }

  const account = {
    id: `ACC-000${counters.account++}`,
    name,
    phone: phone || null,
    fax: fax || null,
    website: website || null,
    vatNumber: vatNumber || null,
    primaryContactName: primaryContactName || null,
    sector: sector || null,
    naceCode: naceCode || null,
    ownership: ownership || null,
    annualRevenue: annualRevenue ?? null,
    numberOfEmployees: numberOfEmployees ?? null,
    description: description || null,
    originatingLeadId: originatingLeadId || null,
    preferredCommunication: preferredCommunication || "E-mail",
    allowEmail: allowEmail !== undefined ? allowEmail : true,
    allowBulkMail: allowBulkMail !== undefined ? allowBulkMail : true,
    allowPhone: allowPhone !== undefined ? allowPhone : true,
    createdAt: now(),
  };
  db.accounts.unshift(account);
  res.status(201).json(account);
});

app.get("/api/accounts", (req, res) => res.json(db.accounts));
app.get("/api/accounts/:id", (req, res) => {
  const a = db.accounts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(a);
});
app.patch("/api/accounts/:id", (req, res) => {
  const a = db.accounts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: "NOT_FOUND" });
  Object.assign(a, req.body);
  res.json(a);
});

// ---------------------------------------------------------------------------
// PROSPECT (Lead)
// Onglet Résumé : Rubrique*, Prénom, Nom*, Fonction, Tél. pro, Tél. mobile, E-mail,
//   Société*, Site Web, Adresse (Rue1/2/3, Ville, Département, Code postal, Pays),
//   En-tête : Source du prospect, Classement, Statut, Propriétaire
// Business Process Flow : Qualifier -> Développer (verrouillée tant que non qualifié)
// ---------------------------------------------------------------------------
app.post("/api/leads", (req, res) => {
  const {
    topic, firstName, lastName, jobTitle, businessPhone, mobilePhone, email,
    company, website, vatNumber, street1, street2, street3, city, stateProvince, postalCode, country,
    leadSource, rating,
  } = req.body;

  // Champs obligatoires réels du formulaire D365 : Rubrique, Nom, Société
  const missing = [];
  if (!topic) missing.push("topic (Rubrique)");
  if (!lastName) missing.push("lastName (Nom)");
  if (!company) missing.push("company (Société)");
  if (missing.length) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: `Le champ ${missing[0].split(" ")[0]} est obligatoire`,
      missingFields: missing,
    });
  }

  const normalizedVat = normalizeVat(vatNumber);
  if (vatNumber && !/^BE0[0-9]{9}$/.test(normalizedVat || "")) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Le numéro de TVA doit être au format belge (ex. BE 0648.747.183)",
      missingFields: ["vatNumber (format invalide)"],
    });
  }

  // Détection de doublon (e-mail, téléphone pro/mobile, ou n° de TVA déjà connu)
  const duplicate = db.leads.find(
    (l) =>
      (email && l.email === email) ||
      (businessPhone && l.businessPhone === businessPhone) ||
      (mobilePhone && l.mobilePhone === mobilePhone) ||
      (normalizedVat && normalizeVat(l.vatNumber) === normalizedVat)
  );
  if (duplicate) {
    return res.status(409).json({
      error: "DUPLICATE_LEAD",
      message: "Un prospect avec cet e-mail, ce téléphone ou ce n° de TVA existe déjà",
      existingLeadId: duplicate.id,
    });
  }

  const { zone, owner } = assignOwner(city);
  const lead = {
    id: `LEAD-0${counters.lead++}`,
    topic,
    firstName: firstName || null,
    lastName,
    jobTitle: jobTitle || null,
    businessPhone: businessPhone || null,
    mobilePhone: mobilePhone || null,
    email: email || null,
    company,
    website: website || null,
    vatNumber: vatNumber || null,
    address: {
      street1: street1 || null,
      street2: street2 || null,
      street3: street3 || null,
      city: city || null,
      stateProvince: stateProvince || null,
      postalCode: postalCode || null,
      country: country || "Belgique",
    },
    leadSource: leadSource || "Site Web",
    rating: rating || "Chaud",
    status: "Nouveau",
    zone,
    owner,
    bpfStage: "Qualifier", // étape 1 du Business Process Flow
    qualified: false,
    createdAt: now(),
  };
  db.leads.unshift(lead);

  const task = createTask(`Premier contact prospect — ${lead.lastName}`, owner, addDays(new Date(), 1));

  res.status(201).json({ message: "Prospect enregistré avec succès", lead, task });
});

app.get("/api/leads", (req, res) => res.json(db.leads));
app.get("/api/leads/:id", (req, res) => {
  const l = db.leads.find((x) => x.id === req.params.id);
  if (!l) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(l);
});

// Qualification du prospect (BPF étape "Qualifier" -> "Développer")
// Crée le Compte + l'Opportunité correspondants (comme le fait D365 nativement)
app.post("/api/leads/:id/qualify", (req, res) => {
  const lead = db.leads.find((x) => x.id === req.params.id);
  if (!lead) return res.status(404).json({ error: "NOT_FOUND", message: "Prospect introuvable" });

  if (lead.qualified) {
    return res.status(409).json({ error: "ALREADY_QUALIFIED", message: "Ce prospect est déjà qualifié" });
  }
  if (lead.bpfStage !== "Qualifier") {
    return res.status(409).json({ error: "INVALID_STAGE", message: "Le prospect n'est pas à l'étape Qualifier" });
  }
  // Règle : il faut au moins un moyen de contact avant de qualifier
  if (!lead.email && !lead.businessPhone && !lead.mobilePhone) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Un moyen de contact (e-mail ou téléphone) est requis avant de qualifier le prospect",
    });
  }

  const account = {
    id: `ACC-000${counters.account++}`,
    name: lead.company,
    phone: lead.businessPhone,
    fax: null,
    website: lead.website,
    vatNumber: lead.vatNumber,
    primaryContactName: `${lead.firstName || ""} ${lead.lastName}`.trim(),
    sector: null,
    naceCode: null,
    ownership: null,
    annualRevenue: null,
    numberOfEmployees: null,
    description: null,
    originatingLeadId: lead.id,
    preferredCommunication: "E-mail",
    allowEmail: true,
    allowBulkMail: true,
    allowPhone: true,
    createdAt: now(),
  };
  db.accounts.unshift(account);

  const opportunity = {
    id: `OPP-000${counters.opp++}`,
    accountId: account.id,
    contactName: account.primaryContactName,
    topic: lead.topic,
    estimatedAmount: null,
    estimatedCloseDate: addDays(new Date(), 30).toISOString(),
    phase: "Qualification",
    status: "Ouverte",
    leadId: lead.id,
    createdAt: now(),
  };
  db.opportunities.unshift(opportunity);

  lead.qualified = true;
  lead.status = "Qualifié";
  lead.bpfStage = "Développer";

  const task = createTask(`Développer l'opportunité — ${account.name}`, lead.owner, new Date());

  res.status(201).json({
    message: "Prospect qualifié : Compte et Opportunité créés",
    lead,
    account,
    opportunity,
    task,
  });
});

// ---------------------------------------------------------------------------
// OPPORTUNITÉ
// Liée à un Compte, phases Qualification -> Développement -> Proposition -> Clôture
// ---------------------------------------------------------------------------
const OPP_PHASES = ["Qualification", "Développement", "Proposition", "Clôture"];

app.post("/api/opportunities", (req, res) => {
  const { accountId, contactName, topic, estimatedAmount, estimatedCloseDate } = req.body;
  if (!accountId || !topic) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "accountId et topic sont obligatoires" });
  }
  const account = db.accounts.find((a) => a.id === accountId);
  if (!account) return res.status(404).json({ error: "NOT_FOUND", message: "Compte introuvable" });

  const opportunity = {
    id: `OPP-000${counters.opp++}`,
    accountId,
    contactName: contactName || account.primaryContactName,
    topic,
    estimatedAmount: estimatedAmount ?? null,
    estimatedCloseDate: estimatedCloseDate || addDays(new Date(), 30).toISOString(),
    phase: "Qualification",
    status: "Ouverte",
    leadId: null,
    createdAt: now(),
  };
  db.opportunities.unshift(opportunity);
  res.status(201).json(opportunity);
});

app.get("/api/opportunities", (req, res) => res.json(db.opportunities));
app.get("/api/opportunities/:id", (req, res) => {
  const o = db.opportunities.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(o);
});

// Avancer la phase de l'opportunité (Qualification -> ... -> Clôture)
app.patch("/api/opportunities/:id", (req, res) => {
  const o = db.opportunities.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: "NOT_FOUND" });

  if (req.body.phase) {
    if (!OPP_PHASES.includes(req.body.phase)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Phase invalide", validPhases: OPP_PHASES });
    }
    o.phase = req.body.phase;
  }
  if (req.body.estimatedAmount !== undefined) o.estimatedAmount = req.body.estimatedAmount;
  if (req.body.status) o.status = req.body.status;

  res.json(o);
});

// ---------------------------------------------------------------------------
// DEVIS (Quote) — lié à une Opportunité
// ---------------------------------------------------------------------------
app.post("/api/quotes", (req, res) => {
  const { opportunityId, client, trajet, price, cargoType, validityDays = 15 } = req.body;
  if (!opportunityId || !client || !trajet || price === undefined) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "opportunityId, client, trajet et price sont obligatoires",
    });
  }
  const opportunity = db.opportunities.find((o) => o.id === opportunityId);
  if (!opportunity) return res.status(404).json({ error: "NOT_FOUND", message: "Opportunité introuvable" });
  if (opportunity.phase === "Clôture" && opportunity.status === "Gagnée") {
    return res.status(409).json({
      error: "OPPORTUNITY_ALREADY_WON",
      message: "Cette opportunité est déjà gagnée, un nouveau devis ne peut pas y être rattaché",
    });
  }

  const quote = {
    id: `DEV-2026-0${counters.quote++}`,
    opportunityId,
    client,
    trajet,
    price,
    cargoType: cargoType || null,
    status: "Envoyé",
    proofAttached: false,
    createdAt: now(),
    expiresAt: addDays(new Date(), Number(validityDays)).toISOString(),
  };
  db.quotes.unshift(quote);

  // Le montant estimé de l'Opportunité reflète le dernier devis envoyé
  opportunity.estimatedAmount = price;

  res.status(201).json(quote);
});

app.patch("/api/quotes/:id", (req, res) => {
  const quote = db.quotes.find((q) => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: "NOT_FOUND" });

  const isExpired = new Date() > new Date(quote.expiresAt);

  // L'expiration prime sur toute tentative d'acceptation tardive : un devis expiré ne
  // peut pas être (re)marqué "Accepté par le client", même s'il ne l'a jamais été.
  if (isExpired && req.body.status === "Accepté par le client" && quote.status !== "Accepté par le client") {
    quote.status = "Expiré";
    createTask(`Relance commerciale — devis expiré ${quote.id}`, "Sophie Renard", new Date());
    return res.status(409).json({
      error: "QUOTE_EXPIRED",
      message: "Le devis a expiré, il ne peut plus être accepté par le client",
    });
  }

  if (req.body.status) quote.status = req.body.status;
  if (req.body.proofAttached !== undefined) quote.proofAttached = req.body.proofAttached;

  if (isExpired && quote.status !== "Accepté par le client") {
    quote.status = "Expiré";
    createTask(`Relance commerciale — devis expiré ${quote.id}`, "Sophie Renard", new Date());
  }

  res.json(quote);
});

app.post("/api/quotes/:id/convert", (req, res) => {
  const quote = db.quotes.find((q) => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: "NOT_FOUND", message: "Devis introuvable" });

  // L'expiration bloque la conversion inconditionnellement, même si le devis a été
  // marqué "Accepté par le client" après sa date d'expiration.
  if (new Date() > new Date(quote.expiresAt)) {
    quote.status = "Expiré";
    return res.status(409).json({ error: "QUOTE_EXPIRED", message: "Le devis a expiré, la conversion n'est plus possible" });
  }
  if (quote.status !== "Accepté par le client") {
    return res.status(409).json({ error: "QUOTE_NOT_ACCEPTED", message: "Le devis doit être accepté par le client avant conversion" });
  }
  if (!quote.proofAttached) {
    return res.status(409).json({ error: "PROOF_MISSING", message: "Une preuve d'accord signée est requise pour convertir ce devis" });
  }

  const opportunity = db.opportunities.find((o) => o.id === quote.opportunityId);
  if (opportunity && opportunity.phase === "Clôture" && opportunity.status === "Gagnée") {
    return res.status(409).json({
      error: "OPPORTUNITY_ALREADY_WON",
      message: "Cette opportunité est déjà gagnée, une seule commande peut en être issue",
    });
  }
  if (opportunity) {
    opportunity.phase = "Clôture";
    opportunity.status = "Gagnée";
    opportunity.estimatedAmount = quote.price;
  }

  const order = {
    id: `CMD-2026-0${counters.order++}`,
    quoteId: quote.id,
    opportunityId: quote.opportunityId,
    client: quote.client,
    trajet: quote.trajet,
    price: quote.price,
    cargoType: quote.cargoType,
    status: "Confirmée",
    createdAt: now(),
  };
  db.orders.unshift(order);

  const emailNotif = notify(
    "email",
    "exploitation@belespoir-export.be",
    `Nouvelle commande ${order.id}`,
    `Commande créée depuis le devis ${quote.id} — Client: ${order.client}, Trajet: ${order.trajet}, Prix: ${order.price} EUR`
  );
  const task = createTask(`Planifier le transport ${order.id}`, "Service Exploitation", new Date());

  res.status(201).json({ message: "Devis converti en commande", quote, order, opportunity, emailNotif, task });
});

app.get("/api/quotes", (req, res) => res.json(db.quotes));
app.get("/api/orders", (req, res) => res.json(db.orders));

// ---------------------------------------------------------------------------
// DOSSIER (Case) — réclamation avec SLA automatique
// ---------------------------------------------------------------------------
app.post("/api/cases", (req, res) => {
  const { orderId, client, category, openedHoursAgo } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Une réclamation doit être rattachée à une commande existante" });
  }
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return res.status(404).json({ error: "NOT_FOUND", message: "Commande introuvable" });

  if (!category || !SLA_HOURS[category]) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Catégorie invalide (Retard / Dommage marchandise / Facturation / Autre)",
    });
  }

  const slaHours = SLA_HOURS[category];
  // openedHoursAgo : utilitaire de test permettant de simuler un dossier ouvert
  // depuis N heures, pour tester le dépassement/l'escalade de SLA sans attendre.
  const openedAt = openedHoursAgo ? addHours(new Date(), -Number(openedHoursAgo)) : new Date();
  const c = {
    id: `CAS-2026-00${++counters.case}`,
    orderId,
    client: client || order.client,
    category,
    slaHours,
    status: "Ouvert",
    createdAt: openedAt.toISOString(),
    dueAt: addHours(openedAt, slaHours).toISOString(),
    resolvedAt: null,
    slaBreached: false,
    escalationLevel: 0,
    escalatedAt: null,
  };
  db.cases.unshift(c);
  evaluateSla(c);
  res.status(201).json(c);
});

app.post("/api/cases/:id/resolve", (req, res) => {
  const c = db.cases.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "NOT_FOUND" });
  if (c.status === "Résolu") return res.status(409).json({ error: "ALREADY_RESOLVED" });

  c.resolvedAt = now();
  c.slaBreached = new Date(c.resolvedAt) > new Date(c.dueAt);
  c.status = c.slaBreached ? "Résolu (SLA dépassé)" : "Résolu";

  const emailNotif = notify("email", c.client, `Réclamation ${c.id} résolue`, `Votre réclamation (${c.category}) a été résolue. Merci de votre confiance.`);
  const survey = notify("survey", c.client, "Enquête de satisfaction", `Merci de nous donner votre avis suite à la résolution du dossier ${c.id}`);

  res.json({ message: "Dossier résolu", case: c, emailNotif, survey });
});

app.get("/api/cases", (req, res) => res.json(db.cases));

// Évalue le SLA d'un dossier et applique l'escalade automatique à 2 niveaux :
//   Niveau 1 (dépassement) -> alerte au responsable service client
//   Niveau 2 (dépassement + ESCALATION_EXTRA_HOURS sans résolution) -> alerte à la direction
function evaluateSla(c) {
  if (c.status === "Résolu" || c.status.startsWith("Résolu")) return c;
  const nowDate = new Date();

  if (nowDate > new Date(c.dueAt) && c.escalationLevel < 1) {
    c.slaBreached = true;
    c.status = "SLA dépassé";
    c.escalationLevel = 1;
    c.escalatedAt = now();
    notify(
      "alert",
      "responsable.service-client@belespoir-export.be",
      `SLA dépassé — ${c.id}`,
      `Le dossier ${c.id} (${c.category}) a dépassé son SLA de ${c.slaHours}h sans résolution.`
    );
  }

  const escalationDueAt = addHours(new Date(c.dueAt), ESCALATION_EXTRA_HOURS);
  if (c.escalationLevel === 1 && nowDate > escalationDueAt) {
    c.status = "Escaladé - Direction";
    c.escalationLevel = 2;
    c.escalatedAt = now();
    notify(
      "alert",
      "direction@belespoir-export.be",
      `Escalade niveau 2 — ${c.id}`,
      `Le dossier ${c.id} (${c.category}) reste non résolu ${ESCALATION_EXTRA_HOURS}h après le dépassement de son SLA : escalade à la direction.`
    );
    createTask(`Escalade direction — dossier ${c.id}`, "Direction Générale", new Date());
  }
  return c;
}

// Vérification immédiate et déterministe du SLA d'un dossier (utilisée par les tests,
// en complément de la vérification périodique automatique ci-dessous)
app.post("/api/cases/:id/check-sla", (req, res) => {
  const c = db.cases.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "NOT_FOUND" });
  evaluateSla(c);
  res.json(c);
});

// Vérification périodique du dépassement/de l'escalade de SLA — toutes les 10s pour la démo
setInterval(() => {
  db.cases.forEach((c) => {
    if (c.status !== "Résolu" && !c.status.startsWith("Résolu")) evaluateSla(c);
  });
}, 10000);

// ---------------------------------------------------------------------------
// Notifications / tâches / utilitaires
// ---------------------------------------------------------------------------
app.get("/api/notifications", (req, res) => res.json(db.notifications));
app.get("/api/tasks", (req, res) => res.json(db.tasks));

app.post("/api/reset", (req, res) => {
  db.accounts = [];
  db.leads = [];
  db.opportunities = [];
  db.quotes = [];
  db.orders = [];
  db.cases = [];
  db.tasks = [];
  db.notifications = [];
  counters = { account: 1, lead: 100, opp: 1, quote: 200, order: 200, case: 0 };
  res.json({ message: "Données réinitialisées" });
});

app.get("/api/health", (req, res) => res.json({ status: "ok", time: now() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Mock CRM Bel Espoir Export démarré : http://localhost:${PORT}`);
});
