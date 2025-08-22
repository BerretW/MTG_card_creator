import React, { useRef, useCallback, useEffect, useState } from 'react';
import { toPng } from 'html-to-image';
import { CardData } from './types';

import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/appStore';
import { useUiStore } from './store/uiStore';

import EditorPanel from './components/EditorPanel';
import CardPreview from './components/CardPreview';
import TemplateEditor from './components/TemplateEditor';
import Auth from './components/Auth';
import AddToDeckModal from './components/AddToDeckModal';
import DeckManager from './components/DeckManager';
import SymbolPalette from './components/SymbolPalette';

const App: React.FC = () => {
    const { token, userId, login, logout } = useAuthStore();
    const { 
      cardData, templates, artAssets, customSetSymbols, editingCardInfo,
      isLoading, error, loadInitialData, clearData, setCardData,
      resetCard, updateCardInDeck, updateArt, addCustomSetSymbol,
      saveTemplates, deleteTemplate, editCard, isCardUpdateLoading
    } = useAppStore();
    const { 
      isTemplateEditorOpen, isAddToDeckModalOpen, isDeckManagerOpen,
      openTemplateEditor, closeTemplateEditor, openAddToDeckModal,
      closeAddToDeckModal, openDeckManager, closeDeckManager 
    } = useUiStore();

    const [editorWidth, setEditorWidth] = useState(480);
    const [isResizing, setIsResizing] = useState(false);
    const resizeData = useRef({ startX: 0, startWidth: 0 });
    const cardPreviewRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (token) {
            loadInitialData();
        } else {
            clearData();
        }
    }, [token, loadInitialData, clearData]);

    const selectedTemplate = templates.find(t => t.id === cardData.templateId);
    useEffect(() => {
        if (!selectedTemplate && templates.length > 0) {
            setCardData({ templateId: templates[0].id });
        }
    }, [templates, selectedTemplate, setCardData]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        resizeData.current = { startX: e.clientX, startWidth: editorWidth };
    }, [editorWidth]);

    const handleMouseUp = useCallback(() => setIsResizing(false), []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        const delta = e.clientX - resizeData.current.startX;
        const newWidth = resizeData.current.startWidth + delta;
        setEditorWidth(Math.max(380, Math.min(newWidth, 900)));
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);
    
    const handleSymbolInsert = useCallback((symbol: string) => {
        const token = `{${symbol}}`;
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName.toLowerCase() === 'textarea' || activeElement.tagName.toLowerCase() === 'input')) {
            const field = activeElement as HTMLTextAreaElement | HTMLInputElement;
            const start = field.selectionStart ?? 0;
            const end = field.selectionEnd ?? 0;
            const fieldName = field.id as keyof CardData;

            if (fieldName && cardData.hasOwnProperty(fieldName)) {
                const currentValue = cardData[fieldName] as string;
                const newValue = currentValue.slice(0, start) + token + currentValue.slice(end);
                setCardData({ [fieldName]: newValue });
                
                requestAnimationFrame(() => {
                    field.focus();
                    const newCursorPos = start + token.length;
                    field.setSelectionRange(newCursorPos, newCursorPos);
                });
            }
        } else {
             navigator.clipboard.writeText(token);
        }
    }, [cardData, setCardData]);

    const handleDownload = useCallback(() => {
        if (!cardPreviewRef.current) return;
        toPng(cardPreviewRef.current, { cacheBust: true, pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `${cardData.name.replace(/\s+/g, '_') || 'custom-card'}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => console.error('oops, something went wrong!', err));
    }, [cardPreviewRef, cardData.name]);

    if (!token) { return <Auth onLoginSuccess={login} />; }
    if (isLoading) { return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-beleren text-2xl">Načítání...</div>; }
    if (error) { return <div className="min-h-screen bg-gray-900 text-red-500 flex items-center justify-center text-xl">{error}</div>; }
    if (!selectedTemplate) {
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-beleren text-2xl">Žádné šablony nebyly nalezeny. Vytvořte nějakou v editoru.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans relative">
            <div className="absolute top-4 right-4 flex flex-wrap gap-2 md:gap-4 z-20">
                <button onClick={openDeckManager} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm md:text-base">Moje balíčky</button>
                <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm md:text-base">Odhlásit</button>
            </div>

            <header className="w-full max-w-7xl text-center mb-6 pt-16 md:pt-0">
                <h1 className="text-4xl sm:text-5xl font-beleren text-yellow-300">MTG Card Creator</h1>
                <p className="text-gray-400 mt-2">Vytvořte si vlastní Magic: The Gathering karty.</p>
            </header>
            
            <main className="w-full max-w-7xl flex flex-row gap-0">
                <div 
                    style={{ width: `${editorWidth}px` }} 
                    className="flex-shrink-0 bg-gray-800 p-6 rounded-l-2xl shadow-2xl border-l border-t border-b border-gray-700 overflow-y-auto"
                >
                    <EditorPanel />
                </div>

                <div className="w-2 flex-shrink-0 cursor-col-resize bg-gray-700 hover:bg-yellow-400 transition-colors duration-200" onMouseDown={handleMouseDown}/>

                <div className="flex-grow flex-1 flex flex-col items-center gap-6 p-6 border-t border-b border-gray-700">
                    <div ref={cardPreviewRef} className="w-full flex justify-center">
                         <CardPreview cardData={cardData} template={selectedTemplate} />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                        {editingCardInfo ? (
                            <>
                                <button 
                                    onClick={updateCardInDeck} 
                                    disabled={isCardUpdateLoading}
                                    className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-700 text-white font-bold transition order-1 disabled:bg-gray-500 disabled:cursor-wait"
                                >
                                    {isCardUpdateLoading ? 'Ukládám...' : 'Uložit změny'}
                                </button>
                                <button onClick={openAddToDeckModal} className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition order-2">Uložit jako kopii</button>
                            </>
                        ) : (
                            <button onClick={openAddToDeckModal} className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition order-1">Uložit do balíčku</button>
                        )}
                        <button onClick={handleDownload} className="py-2 px-6 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition order-3">Exportovat PNG</button>
                        <button onClick={resetCard} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-bold transition order-4">Resetovat kartu</button>
                    </div>
                </div>
                
                <div className="w-64 flex-shrink-0 p-4 rounded-r-2xl border-r border-t border-b border-gray-700">
                    <SymbolPalette onSymbolClick={handleSymbolInsert} />
                </div>
            </main>

            {isTemplateEditorOpen && <TemplateEditor templates={templates} onSave={saveTemplates} onClose={closeTemplateEditor} currentUserId={userId} onDelete={deleteTemplate}/>}
            {isAddToDeckModalOpen && <AddToDeckModal cardData={cardData} template={selectedTemplate} onClose={closeAddToDeckModal} onDecksUpdated={() => {}}/>}
            {isDeckManagerOpen && <DeckManager onClose={closeDeckManager} onEditCard={editCard}/>}
        </div>
    );
};

export default App;