const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("assert");

// ---------------------------------------------------------------------------
// Construction du contexte : Prospect -> qualification -> Compte + Opportunité
// ---------------------------------------------------------------------------
Given("un compte et une opportunité existent via la qualification d'un prospect", async function () {
  const lead = await this.api("POST", "/leads", {
    topic: "Demande de transport de fret régulier",
    lastName: "Martin",
    company: "Martin Transport SPRL",
    email: `contact.${Date.now()}@martin-transport.be`,
    businessPhone: "+3265998877",
    city: "Mons",
  });
  this.ids.leadId = lead.data.lead.id;

  const qualif = await this.api("POST", `/leads/${this.ids.leadId}/qualify`);
  this.ids.accountId = qualif.data.account.id;
  this.ids.opportunityId = qualif.data.opportunity.id;
});

// ---------------------------------------------------------------------------
// Devis
// ---------------------------------------------------------------------------
When("je crée un devis pour cette opportunité avec un prix de {int}", async function (price) {
  const r = await this.api("POST", "/quotes", {
    opportunityId: this.ids.opportunityId,
    client: "Martin Transport SPRL",
    trajet: "Mons -> Liège",
    price,
  });
  if (r.data.id) this.ids.quoteId = r.data.id;
});

When("je crée un devis déjà expiré pour cette opportunité avec un prix de {int}", async function (price) {
  const r = await this.api("POST", "/quotes", {
    opportunityId: this.ids.opportunityId,
    client: "Martin Transport SPRL",
    trajet: "Mons -> Liège",
    price,
    validityDays: -1, // devis déjà expiré à la création (utilitaire de test déterministe)
  });
  if (r.data.id) this.ids.quoteId = r.data.id;
});

When("le devis est accepté par le client avec la preuve d'accord jointe", async function () {
  await this.api("PATCH", `/quotes/${this.ids.quoteId}`, { status: "Accepté par le client", proofAttached: true });
});

When("le devis est accepté par le client sans preuve d'accord jointe", async function () {
  await this.api("PATCH", `/quotes/${this.ids.quoteId}`, { status: "Accepté par le client" });
});

When("je convertis le devis en commande", async function () {
  this.countersBefore.orders = await this.countOf("orders");
  const r = await this.api("POST", `/quotes/${this.ids.quoteId}/convert`);
  if (r.data.order) this.ids.orderId = r.data.order.id;
});

Then("une commande est créée", function () {
  assert.ok(this.lastResponse.data.order, "Aucune commande dans la réponse");
});

Then("aucune commande supplémentaire n'est créée", async function () {
  const after = await this.countOf("orders");
  assert.strictEqual(after, this.countersBefore.orders, "Le nombre de commandes a changé alors qu'aucune conversion n'aurait dû réussir");
});

Then("l'opportunité passe en phase {string} avec le statut {string}", async function (phase, status) {
  const r = await this.api("GET", `/opportunities/${this.ids.opportunityId}`);
  assert.strictEqual(r.data.phase, phase);
  assert.strictEqual(r.data.status, status);
});

Then("l'opportunité n'est pas passée en phase {string}", async function (phase) {
  const r = await this.api("GET", `/opportunities/${this.ids.opportunityId}`);
  assert.notStrictEqual(r.data.phase, phase);
});

// ---------------------------------------------------------------------------
// Commande complète (prérequis US3) : Prospect -> Qualification -> Devis -> Commande
// ---------------------------------------------------------------------------
Given("une commande existe via le parcours complet Prospect -> Devis -> Commande", async function () {
  const lead = await this.api("POST", "/leads", {
    topic: "Demande de transport de fret régulier",
    lastName: "Petit",
    company: "Petit Logistique SA",
    email: `contact.${Date.now()}@petit-logistique.be`,
    businessPhone: "+3265112233",
    city: "Charleroi",
  });
  const qualif = await this.api("POST", `/leads/${lead.data.lead.id}/qualify`);
  this.ids.opportunityId = qualif.data.opportunity.id;

  const quote = await this.api("POST", "/quotes", {
    opportunityId: this.ids.opportunityId,
    client: "Petit Logistique SA",
    trajet: "Charleroi -> Namur",
    price: 650,
  });
  this.ids.quoteId = quote.data.id;
  await this.api("PATCH", `/quotes/${this.ids.quoteId}`, { status: "Accepté par le client", proofAttached: true });
  const convert = await this.api("POST", `/quotes/${this.ids.quoteId}/convert`);
  this.ids.orderId = convert.data.order.id;
});
