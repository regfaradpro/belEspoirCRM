// Utilitaires partagés par les specs UI Playwright.
// Le "chemin heureux" de préparation des données (reset, création via API) est fait
// via `request` pour rester rapide et fiable ; l'action et les assertions testées
// passent par l'interface (page), pour un vrai test front-end.

async function resetData(request) {
  await request.post("/api/reset");
}

/** Crée un Compte + Opportunité via l'API (qualification d'un Prospect), pour servir
 * de prérequis rapide aux tests UI de Devis/Commande et de Dossier. */
async function createQualifiedOpportunity(request, overrides = {}) {
  const leadRes = await request.post("/api/leads", {
    data: {
      topic: "Demande de transport de fret régulier",
      lastName: "Martin",
      company: "Martin Transport SPRL",
      email: `contact.${Date.now()}.${Math.random().toString(36).slice(2)}@martin-transport.be`,
      businessPhone: "+3265998877",
      city: "Mons",
      ...overrides,
    },
  });
  const lead = (await leadRes.json()).lead;
  const qualifyRes = await request.post(`/api/leads/${lead.id}/qualify`);
  const qualif = await qualifyRes.json();
  return { leadId: lead.id, accountId: qualif.account.id, opportunityId: qualif.opportunity.id };
}

/** Construit une commande complète via l'API : Prospect -> Qualification -> Devis -> Commande. */
async function createOrder(request) {
  const { opportunityId } = await createQualifiedOpportunity(request);
  const quoteRes = await request.post("/api/quotes", {
    data: { opportunityId, client: "Martin Transport SPRL", trajet: "Mons -> Liège", price: 650 },
  });
  const quote = await quoteRes.json();
  await request.patch(`/api/quotes/${quote.id}`, { data: { status: "Accepté par le client", proofAttached: true } });
  const convertRes = await request.post(`/api/quotes/${quote.id}/convert`);
  const convert = await convertRes.json();
  return { opportunityId, quoteId: quote.id, orderId: convert.order.id };
}

/**
 * Les champs en lecture seule des formulaires sont rendus en <input disabled>
 * (cf. fieldsHTML dans public/index.html) : leur valeur vit dans l'attribut/la
 * propriété `value`, pas dans le textContent — `toContainText` ne la voit donc
 * jamais. On localise le conteneur `.field` par le texte de son <label>, puis
 * on renvoie son <input> pour une assertion `toHaveValue()`.
 */
function readonlyField(container, label) {
  return container.locator(".field", { hasText: label }).locator("input");
}

module.exports = { resetData, createQualifiedOpportunity, createOrder, readonlyField };
