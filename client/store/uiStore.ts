import { create } from 'zustand';

interface UIState {
  isTemplateEditorOpen: boolean;
  isAddToDeckModalOpen: boolean;
  isDeckManagerOpen: boolean;
  openTemplateEditor: () => void;
  closeTemplateEditor: () => void;
  openAddToDeckModal: () => void;
  closeAddToDeckModal: () => void;
  openDeckManager: () => void;
  closeDeckManager: () => void;
}

export const useUiStore = create<UIState>((set) => ({
  isTemplateEditorOpen: false,
  isAddToDeckModalOpen: false,
  isDeckManagerOpen: false,
  openTemplateEditor: () => set({ isTemplateEditorOpen: true }),
  closeTemplateEditor: () => set({ isTemplateEditorOpen: false }),
  openAddToDeckModal: () => set({ isAddToDeckModalOpen: true }),
  closeAddToDeckModal: () => set({ isAddToDeckModalOpen: false }),
  openDeckManager: () => set({ isDeckManagerOpen: true }),
  closeDeckManager: () => set({ isDeckManagerOpen: false }),
}));