const { setWorldConstructor, setDefaultTimeout } = require("@cucumber/cucumber");

const BASE = process.env.CRM_BASE_URL || "http://localhost:3000/api";
setDefaultTimeout(10 * 1000);

class CrmWorld {
  constructor() {
    this.ids = {}; // leadId, accountId, opportunityId, quoteId, orderId, caseId
    this.lastResponse = null; // { status, data }
    this.countersBefore = {};
  }

  async api(method, path, body) {
    const res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    this.lastResponse = { status: res.status, data };
    return this.lastResponse;
  }

  async countOf(entity) {
    const r = await this.api("GET", "/" + entity);
    return r.data.length;
  }
}

setWorldConstructor(CrmWorld);
