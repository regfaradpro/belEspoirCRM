/**
 * Spécification OpenAPI 3.0 du mock CRM Bel Espoir Export.
 * Décrit fidèlement les routes existantes de server.js — aucune route n'a été
 * renommée ou déplacée, la collection Postman (qa/automation/postman_collection.json)
 * reste donc valable telle quelle.
 */
const errorSchema = (example) => ({
  type: "object",
  properties: {
    error: { type: "string", example },
    message: { type: "string" },
  },
});

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Mock CRM Bel Espoir Export (structure Dynamics 365)",
    version: "1.1.0",
    description:
      "API du mock CRM reproduisant les entités Compte, Prospect, Opportunité, Devis, " +
      "Commande et Dossier de l'instance Dynamics 365 sandbox de Bel Espoir Export SCS " +
      "(BE 0648.747.183). Toutes les données manipulées sont fictives.",
  },
  servers: [{ url: "http://localhost:3000/api", description: "Serveur local" }],
  tags: [
    { name: "Comptes", description: "Account" },
    { name: "Prospects", description: "Lead + Business Process Flow" },
    { name: "Opportunités", description: "Opportunity" },
    { name: "Devis", description: "Quote" },
    { name: "Commandes", description: "Order" },
    { name: "Dossiers", description: "Case + SLA" },
    { name: "Système", description: "Notifications, tâches, reset, santé" },
  ],
  components: {
    schemas: {
      Account: {
        type: "object",
        properties: {
          id: { type: "string", example: "ACC-0001" },
          name: { type: "string" },
          phone: { type: "string", nullable: true },
          fax: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          vatNumber: { type: "string", nullable: true, example: "BE0648747183" },
          primaryContactName: { type: "string", nullable: true },
          sector: { type: "string", nullable: true },
          naceCode: { type: "string", nullable: true },
          ownership: { type: "string", nullable: true },
          annualRevenue: { type: "number", nullable: true },
          numberOfEmployees: { type: "integer", nullable: true },
          description: { type: "string", nullable: true },
          originatingLeadId: { type: "string", nullable: true },
          preferredCommunication: { type: "string" },
          allowEmail: { type: "boolean" },
          allowBulkMail: { type: "boolean" },
          allowPhone: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Lead: {
        type: "object",
        properties: {
          id: { type: "string", example: "LEAD-0100" },
          topic: { type: "string" },
          firstName: { type: "string", nullable: true },
          lastName: { type: "string" },
          jobTitle: { type: "string", nullable: true },
          businessPhone: { type: "string", nullable: true },
          mobilePhone: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          company: { type: "string" },
          website: { type: "string", nullable: true },
          vatNumber: { type: "string", nullable: true, example: "BE0648747183" },
          address: {
            type: "object",
            properties: {
              street1: { type: "string", nullable: true },
              street2: { type: "string", nullable: true },
              street3: { type: "string", nullable: true },
              city: { type: "string", nullable: true },
              stateProvince: { type: "string", nullable: true },
              postalCode: { type: "string", nullable: true },
              country: { type: "string" },
            },
          },
          leadSource: { type: "string" },
          rating: { type: "string" },
          status: { type: "string", example: "Nouveau" },
          zone: { type: "string" },
          owner: { type: "string" },
          bpfStage: { type: "string", enum: ["Qualifier", "Développer"] },
          qualified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Opportunity: {
        type: "object",
        properties: {
          id: { type: "string", example: "OPP-0001" },
          accountId: { type: "string" },
          contactName: { type: "string", nullable: true },
          topic: { type: "string" },
          estimatedAmount: { type: "number", nullable: true },
          estimatedCloseDate: { type: "string", format: "date-time" },
          phase: { type: "string", enum: ["Qualification", "Développement", "Proposition", "Clôture"] },
          status: { type: "string", example: "Ouverte" },
          leadId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Quote: {
        type: "object",
        properties: {
          id: { type: "string", example: "DEV-2026-0200" },
          opportunityId: { type: "string" },
          client: { type: "string" },
          trajet: { type: "string" },
          price: { type: "number" },
          cargoType: { type: "string", nullable: true },
          status: { type: "string", enum: ["Envoyé", "Accepté par le client", "Expiré"] },
          proofAttached: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string", example: "CMD-2026-0200" },
          quoteId: { type: "string" },
          opportunityId: { type: "string" },
          client: { type: "string" },
          trajet: { type: "string" },
          price: { type: "number" },
          cargoType: { type: "string", nullable: true },
          status: { type: "string", example: "Confirmée" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Case: {
        type: "object",
        properties: {
          id: { type: "string", example: "CAS-2026-001" },
          orderId: { type: "string" },
          client: { type: "string" },
          category: { type: "string", enum: ["Retard", "Dommage marchandise", "Facturation", "Autre"] },
          slaHours: { type: "integer", example: 24 },
          status: { type: "string", example: "Ouvert" },
          createdAt: { type: "string", format: "date-time" },
          dueAt: { type: "string", format: "date-time" },
          resolvedAt: { type: "string", format: "date-time", nullable: true },
          slaBreached: { type: "boolean" },
          escalationLevel: { type: "integer", enum: [0, 1, 2] },
          escalatedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      ValidationError: errorSchema("VALIDATION_ERROR"),
      NotFoundError: errorSchema("NOT_FOUND"),
    },
  },
  paths: {
    "/accounts": {
      post: {
        tags: ["Comptes"],
        summary: "Créer un Compte",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Account" } } } },
        responses: {
          201: { description: "Compte créé", content: { "application/json": { schema: { $ref: "#/components/schemas/Account" } } } },
          400: { description: "Nom du compte manquant", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
        },
      },
      get: {
        tags: ["Comptes"],
        summary: "Lister les Comptes",
        responses: { 200: { description: "Liste des comptes", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Account" } } } } } },
      },
    },
    "/accounts/{id}": {
      get: {
        tags: ["Comptes"],
        summary: "Consulter un Compte",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Compte", content: { "application/json": { schema: { $ref: "#/components/schemas/Account" } } } },
          404: { description: "Compte introuvable", content: { "application/json": { schema: { $ref: "#/components/schemas/NotFoundError" } } } },
        },
      },
      patch: {
        tags: ["Comptes"],
        summary: "Modifier un Compte (Profil de la société)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Compte modifié", content: { "application/json": { schema: { $ref: "#/components/schemas/Account" } } } } },
      },
    },
    "/leads": {
      post: {
        tags: ["Prospects"],
        summary: "Créer un Prospect (AC1.1 champs obligatoires, AC1.2 doublon email/téléphone/TVA, AC1.3 assignation automatique)",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Lead" } } } },
        responses: {
          201: { description: "Prospect créé" },
          400: { description: "Champ obligatoire manquant ou n° de TVA invalide", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
          409: { description: "Doublon détecté (email, téléphone ou n° de TVA)" },
        },
      },
      get: {
        tags: ["Prospects"],
        summary: "Lister les Prospects",
        responses: { 200: { description: "Liste des prospects", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Lead" } } } } } },
      },
    },
    "/leads/{id}": {
      get: {
        tags: ["Prospects"],
        summary: "Consulter un Prospect",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Prospect" }, 404: { description: "Introuvable" } },
      },
    },
    "/leads/{id}/qualify": {
      post: {
        tags: ["Prospects"],
        summary: "Qualifier le Prospect (BPF Qualifier -> Développer) : crée Compte + Opportunité",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          201: { description: "Compte et Opportunité créés" },
          409: { description: "Déjà qualifié ou étape BPF invalide" },
          400: { description: "Aucun moyen de contact renseigné" },
        },
      },
    },
    "/opportunities": {
      post: {
        tags: ["Opportunités"],
        summary: "Créer une Opportunité",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Opportunity" } } } },
        responses: { 201: { description: "Opportunité créée" }, 400: { description: "Champs obligatoires manquants" }, 404: { description: "Compte introuvable" } },
      },
      get: {
        tags: ["Opportunités"],
        summary: "Lister les Opportunités",
        responses: { 200: { description: "Liste", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Opportunity" } } } } } },
      },
    },
    "/opportunities/{id}": {
      get: {
        tags: ["Opportunités"],
        summary: "Consulter une Opportunité",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Opportunité" }, 404: { description: "Introuvable" } },
      },
      patch: {
        tags: ["Opportunités"],
        summary: "Modifier la phase / le montant / le statut",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Opportunité modifiée" }, 400: { description: "Phase invalide" } },
      },
    },
    "/quotes": {
      post: {
        tags: ["Devis"],
        summary: "Créer un devis lié à une Opportunité (synchronise son montant estimé)",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Quote" } } } },
        responses: {
          201: { description: "Devis créé" },
          400: { description: "Champs obligatoires manquants" },
          404: { description: "Opportunité introuvable" },
          409: { description: "Opportunité déjà gagnée (OPPORTUNITY_ALREADY_WON)" },
        },
      },
      get: {
        tags: ["Devis"],
        summary: "Lister les devis",
        responses: { 200: { description: "Liste", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Quote" } } } } } },
      },
    },
    "/quotes/{id}": {
      patch: {
        tags: ["Devis"],
        summary: "Modifier le statut / la preuve d'accord jointe",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Devis modifié" }, 404: { description: "Introuvable" } },
      },
    },
    "/quotes/{id}/convert": {
      post: {
        tags: ["Devis"],
        summary: "Convertir le devis accepté (avec preuve) en Commande — clôture l'Opportunité en Gagnée",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          201: { description: "Commande créée" },
          404: { description: "Devis introuvable" },
          409: {
            description: "QUOTE_EXPIRED / QUOTE_NOT_ACCEPTED / PROOF_MISSING / OPPORTUNITY_ALREADY_WON",
          },
        },
      },
    },
    "/orders": {
      get: {
        tags: ["Commandes"],
        summary: "Lister les Commandes",
        responses: { 200: { description: "Liste", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } } } },
      },
    },
    "/cases": {
      post: {
        tags: ["Dossiers"],
        summary: "Créer une réclamation liée à une Commande (SLA automatique par catégorie)",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Case" } } } },
        responses: {
          201: { description: "Dossier créé" },
          400: { description: "Commande manquante ou catégorie invalide", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
          404: { description: "Commande introuvable" },
        },
      },
      get: {
        tags: ["Dossiers"],
        summary: "Lister les Dossiers",
        responses: { 200: { description: "Liste", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Case" } } } } } },
      },
    },
    "/cases/{id}/resolve": {
      post: {
        tags: ["Dossiers"],
        summary: "Résoudre le Dossier (e-mail + enquête de satisfaction)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Dossier résolu" }, 409: { description: "ALREADY_RESOLVED" }, 404: { description: "Introuvable" } },
      },
    },
    "/cases/{id}/check-sla": {
      post: {
        tags: ["Dossiers"],
        summary: "Vérifier immédiatement le SLA d'un dossier (dépassement + escalade à 2 niveaux) — utilitaire de test déterministe",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Dossier réévalué", content: { "application/json": { schema: { $ref: "#/components/schemas/Case" } } } }, 404: { description: "Introuvable" } },
      },
    },
    "/notifications": {
      get: { tags: ["Système"], summary: "Historique des notifications simulées", responses: { 200: { description: "Liste" } } },
    },
    "/tasks": {
      get: { tags: ["Système"], summary: "Historique des tâches générées", responses: { 200: { description: "Liste" } } },
    },
    "/reset": {
      post: { tags: ["Système"], summary: "Réinitialiser toutes les données", responses: { 200: { description: "Données réinitialisées" } } },
    },
    "/health": {
      get: { tags: ["Système"], summary: "Vérification de disponibilité du serveur", responses: { 200: { description: "ok" } } },
    },
  },
};
