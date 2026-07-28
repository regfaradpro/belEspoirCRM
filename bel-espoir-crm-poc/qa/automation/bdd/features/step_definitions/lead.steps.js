const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("assert");

function rowsToLeadBody(dataTable) {
  const obj = dataTable.rowsHash();
  return obj;
}

Given("un prospect existe déjà avec :", async function (dataTable) {
  const r = await this.api("POST", "/leads", rowsToLeadBody(dataTable));
  if (r.data.lead) this.ids.leadId = r.data.lead.id;
});

When("je crée un prospect avec :", async function (dataTable) {
  const r = await this.api("POST", "/leads", rowsToLeadBody(dataTable));
  if (r.data.lead) this.ids.leadId = r.data.lead.id;
});

Then("le prospect créé a le statut {string}", function (status) {
  assert.strictEqual(this.lastResponse.data.lead.status, status);
});

Then("le prospect créé a l'étape BPF {string}", function (stage) {
  assert.strictEqual(this.lastResponse.data.lead.bpfStage, stage);
});

Then("le prospect créé est assigné à la zone {string}", function (zone) {
  assert.strictEqual(this.lastResponse.data.lead.zone, zone);
});
