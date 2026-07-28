const { test, expect } = require("@playwright/test");
const { resetData, createOrder, readonlyField } = require("./support");

test.describe("US3 - Réclamation client & SLA", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetData(request);
    await createOrder(request);
    await page.goto("/");
  });

  test("TC-US3-01 (succès) - résolution d'une réclamation dans les délais du SLA", async ({ page }) => {
    await page.locator(".nav-item", { hasText: "Dossiers" }).click();
    await page.getByRole("button", { name: "Nouveau dossier" }).click();

    await page.locator("#f_orderId").selectOption({ index: 0 });
    await page.locator("#f_category").selectOption("Retard");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    const detail = page.locator("#detailPane");
    await expect(readonlyField(detail, "Statut")).toHaveValue("Ouvert");
    await page.getByRole("button", { name: "Résoudre le dossier" }).click();
    await expect(readonlyField(detail, "Statut")).toHaveValue("Résolu");
    await expect(page.getByRole("button", { name: "Résoudre" })).toHaveCount(0);
  });

  test("TC-US3-02 (échec) - dépassement du SLA et escalade automatique", async ({ page, request }) => {
    // Le champ "ouvert depuis N heures" est un utilitaire de test (non exposé dans le
    // formulaire UI) : on crée le dossier déjà en retard via l'API, puis on observe et
    // on déclenche l'escalade depuis l'interface, comme le ferait un agent support.
    const ordersRes = await request.get("/api/orders");
    const orderId = (await ordersRes.json())[0].id;
    await request.post("/api/cases", { data: { orderId, category: "Dommage marchandise", openedHoursAgo: 50 } });

    await page.locator(".nav-item", { hasText: "Dossiers" }).click();
    await page.locator("tr.row").first().click();

    const detail = page.locator("#detailPane");
    await expect(readonlyField(detail, "Statut")).toHaveValue("Escaladé - Direction");
    await expect(readonlyField(detail, "Niveau d'escalade")).toHaveValue("2 — Direction");
    await expect(page.getByRole("button", { name: "Résoudre (SLA dépassé)" })).toBeVisible();

    // Le bouton "Vérifier le SLA" permet de rejouer l'évaluation sans attendre le cycle
    // périodique automatique (10s en démo)
    await page.getByRole("button", { name: "Vérifier le SLA" }).click();
    await expect(readonlyField(detail, "Statut")).toHaveValue("Escaladé - Direction");
  });

  test("TC-US3-03 (échec) - réclamation refusée sans commande associée", async ({ page, request }) => {
    await resetData(request); // repart sans aucune commande disponible
    await page.goto("/");

    await page.locator(".nav-item", { hasText: "Dossiers" }).click();
    await page.getByRole("button", { name: "Nouveau dossier" }).click();
    await page.locator("#f_category").selectOption("Facturation");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page.locator("#formAlert .alert-error")).toContainText("commande");
  });
});
