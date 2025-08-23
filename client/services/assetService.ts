// client/src/services/assetService.ts

import {
  ArtAsset,
  CustomSetSymbol,
  Template,
  Deck,
  SavedCard,
  CardData,
} from "../types";
const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:3001"
}/api`;

const getAuthToken = () => localStorage.getItem("accessToken");

// Pomocná funkce pro zpracování dat šablony ze serveru.
// Zajišťuje, že ID je vždy string a že JSON pole jsou správně parsována.
const processTemplateFromServer = (template: any): Template => ({
  ...template,
  id: template.id.toString(), // Převedeme ID na string pro konzistenci na frontendu
  elements:
    typeof template.elements === "string"
      ? JSON.parse(template.elements)
      : template.elements,
  fonts:
    typeof template.fonts === "string"
      ? JSON.parse(template.fonts)
      : template.fonts,
});

export const assetService = {
  /**
   * Získá všechny obrázky (art assets) pro přihlášeného uživatele.
   */
  getArtAssets: async (): Promise<ArtAsset[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/assets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch assets");
    const assets = await response.json();
    return assets.map((asset: any) => ({ id: asset.id, dataUrl: asset.url }));
  },

  /**
   * Nahraje nový obrázek na server a přidá ho do knihovny.
   */
  addArtAsset: async (dataUrl: string): Promise<ArtAsset> => {
    const token = getAuthToken();
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append("art", blob, "art.png");

    const uploadResponse = await fetch(`${API_URL}/assets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!uploadResponse.ok) throw new Error("Failed to upload asset");
    const newAsset = await uploadResponse.json();
    return { id: newAsset.id, dataUrl: newAsset.url };
  },

  /**
   * Získá všechny šablony pro přihlášeného uživatele.
   */
  getTemplates: async (): Promise<Template[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch templates");
    const templatesFromServer = await response.json();
    return templatesFromServer.map(processTemplateFromServer);
  },

  /**
   * Vytvoří novou šablonu na serveru.
   * @param templateData Data šablony bez ID.
   * @returns Nově vytvořená šablona s ID od serveru.
   */
  createTemplate: async (
    templateData: Omit<Template, "id">
  ): Promise<Template> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(templateData),
    });
    if (!response.ok) throw new Error("Failed to create template");
    const newTemplate = await response.json();
    return processTemplateFromServer(newTemplate);
  },

  /**
   * Aktualizuje existující šablonu na serveru.
   * @param template Kompletní data šablony včetně ID.
   * @returns Aktualizovaná data šablony ze serveru.
   */
  updateTemplate: async (template: Template): Promise<Template> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/templates/${template.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(template),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to update template" }));
      throw new Error(errorData.message);
    }
    const updatedTemplate = await response.json();
    return processTemplateFromServer(updatedTemplate);
  },

  /**
   * Smaže šablonu na serveru.
   * @param templateId ID šablony ke smazání.
   */
  deleteTemplate: async (templateId: string): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/templates/${templateId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to delete template" }));
      throw new Error(errorData.message);
    }
  },

  /**
   * Získá vlastní symboly sad (aktuálně z localStorage).
   */
  getCustomSetSymbols: async (): Promise<CustomSetSymbol[]> => {
    const stored = localStorage.getItem("customSetSymbols");
    return stored ? JSON.parse(stored) : [];
  },

  /**
   * Přidá nový vlastní symbol sady (aktuálně do localStorage).
   */
  addCustomSetSymbol: async (
    name: string,
    url: string
  ): Promise<CustomSetSymbol> => {
    const currentSymbols = await assetService.getCustomSetSymbols();
    const newSymbol: CustomSetSymbol = {
      id: `custom-${Date.now()}`,
      name,
      url,
    };
    const updatedSymbols = [...currentSymbols, newSymbol];
    localStorage.setItem("customSetSymbols", JSON.stringify(updatedSymbols));
    return newSymbol;
  },

  getDecks: async (): Promise<Deck[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/decks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Nepodařilo se načíst balíčky.");
    return response.json();
  },

  getDeckById: async (deckId: number): Promise<Deck> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/decks/${deckId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Nepodařilo se načíst balíček.");
    return response.json();
  },

  createDeck: async (name: string, description: string): Promise<Deck> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/decks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error("Nepodařilo se vytvořit balíček.");
    return response.json();
  },

  deleteDeck: async (deckId: number): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/decks/${deckId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Nepodařilo se smazat balíček.");
  },

  addCardToDeck: async (
    deckId: number,
    card_data: CardData,
    template_data: Template
  ): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/decks/${deckId}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ card_data, template_data }),
    });
    if (!response.ok) throw new Error("Nepodařilo se přidat kartu do balíčku.");
  },

  removeCardFromDeck: async (deckId: number, cardId: number): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/decks/${deckId}/cards/${cardId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Nepodařilo se odebrat kartu z balíčku.");
  },
  updateCardInDeck: async (
    deckId: number,
    cardId: number,
    card_data: CardData,
    template_data: Template
  ): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/decks/${deckId}/cards/${cardId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ card_data, template_data }),
    });
    if (!response.ok) throw new Error("Nepodařilo se aktualizovat kartu.");
  },

  removeArtAsset: async (assetId: number): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/assets/${assetId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Nepodařilo se smazat obrázek.");
  },

  toggleDeckPublicStatus: async (deckId: number, is_public: boolean): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/decks/${deckId}/toggle-public`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ is_public }),
        });
        if (!response.ok) throw new Error('Nepodařilo se změnit viditelnost balíčku.');
    },

    getPublicDecks: async (): Promise<Deck[]> => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/decks/public`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Nepodařilo se načíst veřejné balíčky.');
        return response.json();
    },

    getPublicDeckById: async (deckId: number): Promise<Deck> => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/decks/public/${deckId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Nepodařilo se načíst veřejný balíček.');
        return response.json();
    },
};
