import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { CardData, Template, ArtAsset, CustomSetSymbol, SavedCard } from './types';
import EditorPanel from './components/EditorPanel';
import CardPreview from './components/CardPreview';
import TemplateEditor from './components/TemplateEditor';
import Auth from './components/Auth';
import AddToDeckModal from './components/AddToDeckModal';
import DeckManager from './components/DeckManager';
import SymbolPalette from './components/SymbolPalette';
import { DEFAULT_CARD_DATA } from './constants';
import { assetService } from './services/assetService';

const getUserIdFromToken = (token: string | null): number | null => {
    if (!token) return null;
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = atob(payloadBase64);
        const payload = JSON.parse(decodedPayload);
        return payload.id || null;
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
};

const App: React.FC = () => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
    const [cardData, setCardData] = useState<CardData>(DEFAULT_CARD_DATA);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [artAssets, setArtAssets] = useState<ArtAsset[]>([]);
    const [customSetSymbols, setCustomSetSymbols] = useState<CustomSetSymbol[]>([]);
    
    const [editingCardInfo, setEditingCardInfo] = useState<{cardId: number, deckId: number} | null>(null);

    const [isTemplateEditorOpen, setTemplateEditorOpen] = useState(false);
    const [isAddToDeckModalOpen, setAddToDeckModalOpen] = useState(false);
    const [isDeckManagerOpen, setDeckManagerOpen] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editorWidth, setEditorWidth] = useState(480);
    const [isResizing, setIsResizing] = useState(false);
    const resizeData = useRef({ startX: 0, startWidth: 0 });

    const cardPreviewRef = useRef<HTMLDivElement>(null);
    
    const currentUserId = getUserIdFromToken(token);

    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            return;
        }
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [loadedAssets, loadedSymbols, loadedTemplates] = await Promise.all([
                    assetService.getArtAssets(),
                    assetService.getCustomSetSymbols(),
                    assetService.getTemplates()
                ]);

                setArtAssets(loadedAssets);
                setCustomSetSymbols(loadedSymbols);
                setTemplates(loadedTemplates);

                if (!cardData.templateId && loadedTemplates.length > 0) {
                    setCardData(prev => ({...prev, templateId: loadedTemplates[0].id}));
                }
            } catch (err: any) {
                console.error("Failed to load user data:", err);
                setError("Nepodařilo se načíst data. Váš token mohl vypršet.");
                handleLogout();
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

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
            const currentValue = field.value;
            const newValue = currentValue.slice(0, start) + token + currentValue.slice(end);
            
            const fieldName = field.id as keyof CardData;
            if (fieldName && cardData.hasOwnProperty(fieldName)) {
                 setCardData(prev => ({...prev, [fieldName]: newValue}));
            }

            requestAnimationFrame(() => {
                field.focus();
                const newCursorPos = start + token.length;
                field.setSelectionRange(newCursorPos, newCursorPos);
            });
        } else {
             navigator.clipboard.writeText(token);
        }
    }, [cardData]);

    const handleLoginSuccess = (newToken: string) => {
        localStorage.setItem('accessToken', newToken);
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setToken(null);
        setArtAssets([]);
        setCustomSetSymbols([]);
        setTemplates([]);
        setEditingCardInfo(null);
    };

    const handleArtUpdate = (originalUrl: string, croppedUrl: string) => {
        setCardData(prev => ({ ...prev, art: { original: originalUrl, cropped: croppedUrl } }));
        assetService.addArtAsset(croppedUrl)
            .then(newAsset => setArtAssets(prev => [newAsset, ...prev]))
            .catch(error => alert("Chyba: Nepodařilo se nahrát obrázek do knihovny."));
    };

    const handleAddCustomSetSymbol = async (name: string, dataUrl: string) => {
        const newSymbol = await assetService.addCustomSetSymbol(name, dataUrl);
        setCustomSetSymbols(prev => [...prev, newSymbol]);
        setCardData(prev => ({ ...prev, setSymbolUrl: newSymbol.url }));
    };

    const handleSaveTemplates = async (templatesFromEditor: Template[]) => {
        if (currentUserId === null) {
            alert("Chyba: Nelze ověřit přihlášeného uživatele. Ukládání zrušeno.");
            return;
        }
        try {
            const savePromises = templatesFromEditor.map(template => {
                const { id, authorUsername, ...templateData } = template;
                if (typeof id === 'string' && id.startsWith('new-')) {
                    return assetService.createTemplate({ ...templateData, user_id: currentUserId } as Omit<Template, 'id' | 'authorUsername'>);
                } else if (template.user_id === currentUserId) {
                    return assetService.updateTemplate(template);
                }
                return null;
            }).filter(Boolean);

            if (savePromises.length > 0) {
                await Promise.all(savePromises as Promise<Template>[]);
            }
            
            const allUpdatedTemplates = await assetService.getTemplates();
            setTemplates(allUpdatedTemplates);

            if (!allUpdatedTemplates.some(t => t.id === cardData.templateId)) {
                setCardData(prev => ({ ...prev, templateId: allUpdatedTemplates[0]?.id || '' }));
            }
            alert("Vaše šablony byly úspěšně uloženy!");
        } catch (error) {
            console.error("Failed to save templates:", error);
            alert(`Chyba při ukládání šablon: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            await assetService.deleteTemplate(templateId);
            const remainingTemplates = templates.filter(t => t.id !== templateId);
            setTemplates(remainingTemplates);
            if (cardData.templateId === templateId) {
                setCardData(prev => ({ ...prev, templateId: remainingTemplates[0]?.id || '' }));
            }
            alert("Šablona byla úspěšně smazána.");
        } catch (error) {
            console.error("Failed to delete template:", error);
            alert(`Chyba při mazání šablony: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

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

    const handleReset = () => {
        setCardData(DEFAULT_CARD_DATA);
        setEditingCardInfo(null);
    };

    const handleDecksUpdated = () => {};
    
    const handleEditCard = (cardToEdit: SavedCard) => {
        setCardData(cardToEdit.card_data);
        setEditingCardInfo({ cardId: cardToEdit.id, deckId: cardToEdit.deck_id });
        setDeckManagerOpen(false);
    };

    const handleUpdateCard = async () => {
        if (!editingCardInfo || !selectedTemplate) return;
        try {
            await assetService.updateCardInDeck(editingCardInfo.deckId, editingCardInfo.cardId, cardData, selectedTemplate);
            alert("Karta byla úspěšně aktualizována!");
            setEditingCardInfo(null);
        } catch (error) {
            alert(`Chyba při aktualizaci karty: ${error}`);
        }
    };
    
    const selectedTemplate = templates.find(t => t.id === cardData.templateId);
    
    if (!token) { return <Auth onLoginSuccess={handleLoginSuccess} />; }
    if (isLoading) { return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-beleren text-2xl">Načítání...</div>; }
    if (error) { return <div className="min-h-screen bg-gray-900 text-red-500 flex items-center justify-center text-xl">{error}</div>; }
    if (!selectedTemplate) {
        if (templates.length > 0) {
            setCardData(prev => ({ ...prev, templateId: templates[0].id }));
            return null;
        }
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-beleren text-2xl">Žádné šablony nebyly nalezeny.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans relative">
            <div className="absolute top-4 right-4 flex flex-wrap gap-2 md:gap-4 z-20">
                <button onClick={() => setDeckManagerOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm md:text-base">Moje balíčky</button>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm md:text-base">Odhlásit</button>
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
                    <EditorPanel 
                        cardData={cardData} 
                        setCardData={setCardData} 
                        templates={templates}
                        onOpenTemplateEditor={() => setTemplateEditorOpen(true)}
                        artAssets={artAssets}
                        onArtUpdate={handleArtUpdate}
                        customSetSymbols={customSetSymbols}
                        onAddCustomSetSymbol={handleAddCustomSetSymbol}
                        template={selectedTemplate}
                    />
                </div>

                <div className="w-2 flex-shrink-0 cursor-col-resize bg-gray-700 hover:bg-yellow-400 transition-colors duration-200" onMouseDown={handleMouseDown}/>

                <div className="flex-grow flex-1 flex flex-col items-center gap-6 p-6 border-t border-b border-gray-700">
                    <div ref={cardPreviewRef} className="w-full flex justify-center">
                         <CardPreview cardData={cardData} template={selectedTemplate} />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                        {editingCardInfo ? (
                            <>
                                <button onClick={handleUpdateCard} className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-700 text-white font-bold transition order-1">Uložit změny</button>
                                <button onClick={() => setAddToDeckModalOpen(true)} className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition order-2">Uložit jako kopii</button>
                            </>
                        ) : (
                            <button onClick={() => setAddToDeckModalOpen(true)} className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition order-1">Uložit do balíčku</button>
                        )}
                        <button onClick={handleDownload} className="py-2 px-6 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition order-3">Exportovat PNG</button>
                        <button onClick={handleReset} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-bold transition order-4">Resetovat kartu</button>
                    </div>
                </div>
                
                <div className="w-64 flex-shrink-0 p-4 rounded-r-2xl border-r border-t border-b border-gray-700">
                    <SymbolPalette onSymbolClick={handleSymbolInsert} />
                </div>
            </main>

            {isTemplateEditorOpen && <TemplateEditor templates={templates} onSave={handleSaveTemplates} onClose={() => setTemplateEditorOpen(false)} currentUserId={currentUserId} onDelete={handleDeleteTemplate}/>}
            {isAddToDeckModalOpen && <AddToDeckModal cardData={cardData} template={selectedTemplate} onClose={() => setAddToDeckModalOpen(false)} onDecksUpdated={handleDecksUpdated}/>}
            {isDeckManagerOpen && <DeckManager onClose={() => setDeckManagerOpen(false)} onEditCard={handleEditCard}/>}
        </div>
    );
};

export default App;