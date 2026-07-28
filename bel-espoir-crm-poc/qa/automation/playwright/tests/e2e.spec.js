const { test, expect } = require("@playwright/test");
const { resetData, createQualifiedOpportunity, readonlyField } = require("./support");

test.describe("Parcours end-to-end - Prospect -> Compte -> Opportunité gagnée", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetData(request);
    await page.goto("/");
  });

  test("TC-E2E-01 (succès) - parcours complet réussi jusqu'à la résolution du dossier", async ({ page }) => {
    // 1. Prospect
    await page.locator(".nav-item", { hasText: "Prospects" }).click();
    await page.getByRole("button", { name: "Nouveau prospect" }).click();
    await page.locator("#f_topic").fill("Demande de transport de fret régulier");
    await page.locator("#f_lastName").fill("Lambert");
    await page.locator("#f_company").fill("Distri-Fresh SA");
    await page.locator("#f_email").fill("marie.lambert@distri-fresh.be");
    await page.locator("#f_city").fill("Bruxelles");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(readonlyField(page.locator("#detailPane"), "Propriétaire")).toHaveValue("Julien Petit"); // zone Bruxelles

    // 2. Qualification -> Compte + Opportunité
    await page.getByRole("button", { name: "Qualifier" }).click();
    await expect(page.locator("#detailPane h1")).toContainText("Demande de transport de fret régulier");

    // 3. Devis
    await page.locator(".nav-item", { hasText: "Devis" }).click();
    await page.getByRole("button", { name: "Nouveau devis" }).click();
    await page.locator("#f_opportunityId").selectOption({ index: 0 });
    await page.locator("#f_client").fill("Distri-Fresh SA");
    await page.locator("#f_trajet").fill("Bruxelles -> Anvers (frigorifique)");
    await page.locator("#f_price").fill("45000");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByRole("button", { name: "Marquer accepté par le client" }).click();
    await page.getByRole("button", { name: "Joindre la preuve d'accord" }).click();

    // 4. Conversion en Commande -> l'Opportunité passe en Clôture/Gagnée
    await page.getByRole("button", { name: "Convertir en commande" }).click();
    await expect(readonlyField(page.locator("#detailPane"), "Statut")).toHaveValue("Confirmée");
    await page.locator(".nav-item", { hasText: "Opportunités" }).click();
    await expect(page.locator("tr.row")).toContainText("Gagnée");

    // 5. Dossier lié à la commande, résolu dans le SLA
    await page.locator(".nav-item", { hasText: "Dossiers" }).click();
    await page.getByRole("button", { name: "Nouveau dossier" }).click();
    await page.locator("#f_orderId").selectOption({ index: 0 });
    await page.locator("#f_category").selectOption("Retard");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByRole("button", { name: "Résoudre le dossier" }).click();
    await expect(readonlyField(page.locator("#detailPane"), "Statut")).toHaveValue("Résolu");
  });

  test("TC-E2E-02 (échec) - rupture de parcours : le devis expire avant conversion", async ({ page, request }) => {
    const { opportunityId } = await createQualifiedOpportunity(request);
    // validityDays négatif : utilitaire de test pour obtenir un devis déjà expiré sans attendre
    await request.post("/api/quotes", {
      data: { opportunityId, client: "Martin Transport SPRL", trajet: "Mons -> Liège", price: 1200, validityDays: -1 },
    });
    await page.goto("/");

    await page.locator(".nav-item", { hasText: "Devis" }).click();
    await page.locator("tr.row").first().click();

    // Un devis expiré ne peut même plus être marqué "accepté par le client" : le rejet
    // survient dès cette étape, avant toute tentative de conversion.
    await page.getByRole("button", { name: "Marquer accepté par le client" }).click();
    await expect(page.locator("#formAlert .alert-error")).toContainText("expiré");
    await expect(page.getByRole("button", { name: "Convertir en commande" })).toBeDisabled();

    await page.locator(".nav-item", { hasText: "Commandes" }).click();
    await expect(page.locator(".empty-state")).toBeVisible();
  });
});
