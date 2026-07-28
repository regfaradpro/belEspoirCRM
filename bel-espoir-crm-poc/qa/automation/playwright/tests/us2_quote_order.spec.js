const { test, expect } = require("@playwright/test");
const { resetData, createQualifiedOpportunity, readonlyField } = require("./support");

test.describe("US2 - Conversion d'un devis en commande", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetData(request);
    await createQualifiedOpportunity(request);
    await page.goto("/");
  });

  test("TC-US2-01 (succès) - conversion réussie d'un devis accepté avec preuve jointe", async ({ page }) => {
    await page.locator(".nav-item", { hasText: "Devis" }).click();
    await page.getByRole("button", { name: "Nouveau devis" }).click();

    await page.locator("#f_opportunityId").selectOption({ index: 0 });
    await page.locator("#f_client").fill("Martin Transport SPRL");
    await page.locator("#f_trajet").fill("Mons -> Liège");
    await page.locator("#f_price").fill("850");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page.locator("#detailPane .alert-error")).toContainText("Conversion bloquée");
    await expect(page.getByRole("button", { name: "Convertir en commande" })).toBeDisabled();

    await page.getByRole("button", { name: "Marquer accepté par le client" }).click();
    await page.getByRole("button", { name: "Joindre la preuve d'accord" }).click();
    await expect(page.locator("#detailPane .alert-error")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Convertir en commande" })).toBeEnabled();

    await page.getByRole("button", { name: "Convertir en commande" }).click();

    // Redirigé vers la Commande créée
    await expect(readonlyField(page.locator("#detailPane"), "Statut")).toHaveValue("Confirmée");

    // L'Opportunité passe en phase Clôture / Gagnée (vérifié depuis la grille Opportunités)
    await page.locator(".nav-item", { hasText: "Opportunités" }).click();
    await expect(page.locator("tr.row")).toContainText("Gagnée");
  });

  test("TC-US2-02 (échec) - conversion refusée avant acceptation par le client", async ({ page }) => {
    await page.locator(".nav-item", { hasText: "Devis" }).click();
    await page.getByRole("button", { name: "Nouveau devis" }).click();
    await page.locator("#f_opportunityId").selectOption({ index: 0 });
    await page.locator("#f_client").fill("Martin Transport SPRL");
    await page.locator("#f_trajet").fill("Mons -> Liège");
    await page.locator("#f_price").fill("850");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page.getByRole("button", { name: "Convertir en commande" })).toBeDisabled();
    await expect(page.locator("#detailPane .alert-error")).toContainText("Accepté par le client");
  });

  test("TC-US2-03 (échec) - conversion refusée sans preuve d'accord jointe", async ({ page }) => {
    await page.locator(".nav-item", { hasText: "Devis" }).click();
    await page.getByRole("button", { name: "Nouveau devis" }).click();
    await page.locator("#f_opportunityId").selectOption({ index: 0 });
    await page.locator("#f_client").fill("Martin Transport SPRL");
    await page.locator("#f_trajet").fill("Mons -> Liège");
    await page.locator("#f_price").fill("850");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await page.getByRole("button", { name: "Marquer accepté par le client" }).click();
    await expect(page.getByRole("button", { name: "Convertir en commande" })).toBeDisabled();
    await expect(page.locator("#detailPane .alert-error")).toContainText("preuve d'accord jointe");
  });
});
