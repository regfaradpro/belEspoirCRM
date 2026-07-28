const { test, expect } = require("@playwright/test");
const { resetData, readonlyField } = require("./support");

test.describe("US1 - Création et qualification d'un prospect (Lead)", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetData(request);
    await page.goto("/");
  });

  test("TC-US1-01 (succès) - création d'un Lead avec toutes les informations obligatoires", async ({ page }) => {
    await page.locator(".nav-item", { hasText: "Prospects" }).click();
    await page.getByRole("button", { name: "Nouveau prospect" }).click();

    await page.locator("#f_topic").fill("Demande de transport de fret régulier");
    await page.locator("#f_lastName").fill("Durand");
    await page.locator("#f_company").fill("Transports Durand SPRL");
    await page.locator("#f_email").fill("contact@transports-durand.be");
    await page.locator("#f_businessPhone").fill("+3265123456");
    await page.locator("#f_city").fill("Mons");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    // Redirigé vers la fiche du prospect créé, en vue liste + panneau de détail
    await expect(page.locator("#detailPane h1")).toHaveText("Durand"); // pas de prénom saisi ici
    await expect(page.locator("#detailPane .bpf-stage.active")).toHaveText(/1\. Qualifier/);
    const detail = page.locator("#detailPane");
    await expect(readonlyField(detail, "Statut")).toHaveValue("Nouveau");
    await expect(readonlyField(detail, "Propriétaire")).toHaveValue("Sophie Renard"); // zone Hainaut / Mons
    await expect(page.locator("#listPane tr.row")).toContainText("Transports Durand SPRL");
  });

  test("TC-US1-02 (échec) - un champ obligatoire est manquant", async ({ page }) => {
    await page.locator(".nav-item", { hasText: "Prospects" }).click();
    await page.getByRole("button", { name: "Nouveau prospect" }).click();

    await page.locator("#f_lastName").fill("Julie");
    // Rubrique et Société volontairement laissées vides
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page.locator("#formAlert .alert-error")).toContainText("obligatoire");
  });

  test("TC-US1-03 (échec) - doublon détecté sur l'e-mail", async ({ page }) => {
    await page.locator(".nav-item", { hasText: "Prospects" }).click();
    await page.getByRole("button", { name: "Nouveau prospect" }).click();
    await page.locator("#f_topic").fill("Demande initiale");
    await page.locator("#f_lastName").fill("Durand");
    await page.locator("#f_company").fill("Transports Durand SPRL");
    await page.locator("#f_email").fill("contact@transports-durand.be");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.locator("#detailPane h1")).toBeVisible();

    // Second prospect avec le même e-mail
    await page.getByRole("button", { name: "Vue liste complète" }).click();
    await page.getByRole("button", { name: "Nouveau prospect" }).click();
    await page.locator("#f_topic").fill("Nouvelle demande");
    await page.locator("#f_lastName").fill("Autre");
    await page.locator("#f_company").fill("Une autre société");
    await page.locator("#f_email").fill("contact@transports-durand.be");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page.locator("#formAlert .alert-error")).toContainText("existe déjà");
  });
});
