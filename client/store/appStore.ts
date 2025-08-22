import { create } from 'zustand';
import { CardData, Template, ArtAsset, CustomSetSymbol, SavedCard } from '../types';
import { DEFAULT_CARD_DATA } from '../constants';
import { assetService } from '../services/assetService';
import { useAuthStore } from './authStore';

interface AppState {
  cardData: CardData;
  templates: Template[];
  artAssets: ArtAsset[];
  isTemplateActionLoading: boolean; // Pro ukládání/mazání šablon
  isCardUpdateLoading: boolean; // Pro tlačítko "Uložit změny"
  customSetSymbols: CustomSetSymbol[];
  editingCardInfo: { cardId: number; deckId: number } | null;
  isLoading: boolean;
  error: string | null;
  
  // Akce
  setCardData: (update: Partial<CardData>) => void;
  loadInitialData: () => Promise<void>;
  clearData: () => void; // Pro odhlášení
  updateArt: (originalUrl: string, croppedUrl: string) => Promise<void>;
  addCustomSetSymbol: (name: string, dataUrl: string) => Promise<void>;
  saveTemplates: (templatesFromEditor: Template[]) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  resetCard: () => void;
  editCard: (cardToEdit: SavedCard) => void;
  updateCardInDeck: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  cardData: DEFAULT_CARD_DATA,
  templates: [],
  artAssets: [],
  isTemplateActionLoading: false,
  isCardUpdateLoading: false,
  customSetSymbols: [],
  editingCardInfo: null,
  isLoading: true,
  error: null,

  setCardData: (update) => set((state) => ({ cardData: { ...state.cardData, ...update } })),
  
  loadInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [loadedAssets, loadedSymbols, loadedTemplates] = await Promise.all([
        assetService.getArtAssets(),
        assetService.getCustomSetSymbols(),
        assetService.getTemplates()
      ]);
      set({
        artAssets: loadedAssets,
        customSetSymbols: loadedSymbols,
        templates: loadedTemplates,
        isLoading: false,
      });
    } catch (err: any) {
      console.error("Failed to load user data:", err);
      set({ error: "Nepodařilo se načíst data. Váš token mohl vypršet.", isLoading: false });
      useAuthStore.getState().logout(); // Odhlásíme uživatele při chybě
    }
  },

  clearData: () => {
    set({
      cardData: DEFAULT_CARD_DATA,
      templates: [],
      artAssets: [],
      customSetSymbols: [],
      editingCardInfo: null,
      error: null,
    });
  },

  updateArt: async (originalUrl, croppedUrl) => {
    get().setCardData({ art: { original: originalUrl, cropped: croppedUrl } });
    try {
      const newAsset = await assetService.addArtAsset(croppedUrl);
      set((state) => ({ artAssets: [newAsset, ...state.artAssets] }));
    } catch (error) {
      alert("Chyba: Nepodařilo se nahrát obrázek do knihovny.");
    }
  },
  
  addCustomSetSymbol: async (name, dataUrl) => {
    const newSymbol = await assetService.addCustomSetSymbol(name, dataUrl);
    set(state => ({ customSetSymbols: [...state.customSetSymbols, newSymbol] }));
    get().setCardData({ setSymbolUrl: newSymbol.url });
  },

  saveTemplates: async (templatesFromEditor) => {
    set({ isTemplateActionLoading: true }); // <-- ZAČÁTEK NAČÍTÁNÍ
    const currentUserId = useAuthStore.getState().userId;
    if (currentUserId === null) {
      alert("Chyba: Nelze ověřit přihlášeného uživatele. Ukládání zrušeno.");
      set({ isTemplateActionLoading: false }); // <-- Nezapomenout vypnout i zde
      return;
    }
    try {
      // ... (celá logika mapování a volání assetService)
      const savePromises = templatesFromEditor.map(template => {
        const { id, authorUsername, ...templateData } = template;
        if (typeof id === 'string' && id.startsWith('new-')) {
          return assetService.createTemplate({ ...templateData, user_id: currentUserId } as Omit<Template, 'id' | 'authorUsername'>);
        } else if (template.user_id === currentUserId) {
          return assetService.updateTemplate(template);
        }
        return null;
      }).filter((promise): promise is Promise<Template> => promise !== null);

      if (savePromises.length > 0) {
        await Promise.all(savePromises);
      }
      
      const allUpdatedTemplates = await assetService.getTemplates();
      set({ templates: allUpdatedTemplates });

      const { cardData } = get();
      if (!allUpdatedTemplates.some(t => t.id === cardData.templateId)) {
        get().setCardData({ templateId: allUpdatedTemplates[0]?.id || '' });
      }
      alert("Vaše šablony byly úspěšně uloženy!");
    } catch (error) {
      console.error("Failed to save templates:", error);
      alert(`Chyba při ukládání šablon: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      set({ isTemplateActionLoading: false }); // <-- KONEC NAČÍTÁNÍ (vždy)
    }
  },

  deleteTemplate: async (templateId: string) => {
    // Zde můžeme také použít loading stav, pokud chceme
    // set({ isTemplateActionLoading: true });
    try {
        await assetService.deleteTemplate(templateId);
        const remainingTemplates = get().templates.filter(t => t.id !== templateId);
        set({ templates: remainingTemplates });
        if (get().cardData.templateId === templateId) {
            get().setCardData({ templateId: remainingTemplates[0]?.id || '' });
        }
        alert("Šablona byla úspěšně smazána.");
    } catch (error) {
        console.error("Failed to delete template:", error);
        alert(`Chyba při mazání šablony: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        // set({ isTemplateActionLoading: false });
    }
  },

  resetCard: () => set({ cardData: DEFAULT_CARD_DATA, editingCardInfo: null }),
  
  editCard: (cardToEdit) => {
    set({
      cardData: cardToEdit.card_data,
      editingCardInfo: { cardId: cardToEdit.id, deckId: cardToEdit.deck_id },
    });
    // Použijeme 'lazy import' s 'require', abychom předešli problémům s cyklickou závislostí mezi stores.
    // Dáme to do 'setTimeout', aby se to vykonalo v dalším ticku, až bude vše inicializováno.
    setTimeout(() => {
        const { useUiStore } = require('./uiStore'); 
        useUiStore.getState().closeDeckManager();
    }, 0);
  },
  
updateCardInDeck: async () => {
    set({ isCardUpdateLoading: true }); // <-- ZAČÁTEK NAČÍTÁNÍ
    const { editingCardInfo, cardData, templates } = get();
    const selectedTemplate = templates.find(t => t.id === cardData.templateId);
    if (!editingCardInfo || !selectedTemplate) {
      set({ isCardUpdateLoading: false });
      return;
    }
    try {
        await assetService.updateCardInDeck(editingCardInfo.deckId, editingCardInfo.cardId, cardData, selectedTemplate);
        alert("Karta byla úspěšně aktualizována!");
        set({ editingCardInfo: null });
    } catch (error) {
        alert(`Chyba při aktualizaci karty: ${error}`);
    } finally {
        set({ isCardUpdateLoading: false }); // <-- KONEC NAČÍTÁNÍ (vždy)
    }
  },
}));