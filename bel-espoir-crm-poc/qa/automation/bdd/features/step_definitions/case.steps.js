const { When, Then } = require("@cucumber/cucumber");
const assert = require("assert");

function caseObj(world) {
  return world.lastResponse.data.case || world.lastResponse.data;
}

When("je crée une réclamation de catégorie {string} liée à cette commande", async function (category) {
  const r = await this.api("POST", "/cases", { orderId: this.ids.orderId, category });
  if (r.data.id) this.ids.caseId = r.data.id;
});

When("je crée une réclamation de catégorie {string} liée à cette commande, ouverte depuis {int} heures", async function (category, hours) {
  const r = await this.api("POST", "/cases", { orderId: this.ids.orderId, category, openedHoursAgo: hours });
  if (r.data.id) this.ids.caseId = r.data.id;
});

When("je crée une réclamation de catégorie {string} sans commande associée", async function (category) {
  await this.api("POST", "/cases", { category });
});

When("je résous la réclamation", async function () {
  await this.api("POST", `/cases/${this.ids.caseId}/resolve`);
});

Then("la réclamation a le statut {string}", function (status) {
  assert.strictEqual(caseObj(this).status, status);
});
