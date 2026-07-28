const { Given, Then } = require("@cucumber/cucumber");
const assert = require("assert");

Given("les données du CRM sont réinitialisées", async function () {
  await this.api("POST", "/reset");
});

Then("la réponse a le code {int}", function (code) {
  assert.strictEqual(
    this.lastResponse.status,
    code,
    `Code attendu ${code}, obtenu ${this.lastResponse.status} — réponse : ${JSON.stringify(this.lastResponse.data)}`
  );
});

Then("l'erreur retournée est {string}", function (errorCode) {
  assert.strictEqual(this.lastResponse.data.error, errorCode);
});
