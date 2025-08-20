import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { CardData, Template, ArtAsset, CustomSetSymbol } from './types';
import EditorPanel from './components/EditorPanel';
import CardPreview from './components/CardPreview';
import TemplateEditor from './components/TemplateEditor';
import Auth from './components/Auth';
import AddToDeckModal from './components/AddToDeckModal'; // Import pro ukládání do balíčku
import DeckManager from './components/DeckManager'; // Import pro správu balíčků
import { DEFAULT_CARD_DATA } from './constants';
import { assetService } from './services/assetService';

const App: React.FC = () => {
    // --- Autentizace a hlavní stavy ---
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
    const [cardData, setCardData] = useState<CardData>(DEFAULT_CARD_DATA);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [artAssets, setArtAssets] = useState<ArtAsset[]>([]);
    const [customSetSymbols, setCustomSetSymbols] = useState<CustomSetSymbol[]>([]);
    
    // --- Stavy pro ovládání modálních oken ---
    const [isTemplateEditorOpen, setTemplateEditorOpen] = useState(false);
    const [isAddToDeckModalOpen, setAddToDeckModalOpen] = useState(false);
    const [isDeckManagerOpen, setDeckManagerOpen] = useState(false);
    
    // --- Stavy pro načítání a chyby ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cardPreviewRef = useRef<HTMLDivElement>(null);
    
    // Načítání všech potřebných dat po přihlášení
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
    }, [token]);

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
        try {
            const savePromises = templatesFromEditor.map(template => {
                const { id, ...templateData } = template;
                if (typeof id === 'string' && id.startsWith('new-')) {
                    return assetService.createTemplate(templateData as Omit<Template, 'id'>);
                } else {
                    return assetService.updateTemplate(template);
                }
            });
            const savedTemplates = await Promise.all(savePromises);
            setTemplates(savedTemplates);
            if (!savedTemplates.some(t => t.id === cardData.templateId)) {
                setCardData(prev => ({ ...prev, templateId: savedTemplates[0]?.id || '' }));
            }
            alert("Šablony úspěšně uloženy na server!");
        } catch (error) {
            console.error("Failed to save templates:", error);
            alert(`Chyba při ukládání šablon: ${error instanceof Error ? error.message : String(error)}`);
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

    const handleReset = () => setCardData(DEFAULT_CARD_DATA);

    const handleDecksUpdated = () => {
        // Tato funkce je zde pro případ, že bychom v budoucnu potřebovali
        // globálně obnovit data o balíčcích po nějaké akci v modálním okně.
    };
    
    const selectedTemplate = templates.find(t => t.id === cardData.templateId) || templates[0];
    
    // --- Renderovací logika ---

    if (!token) { return <Auth onLoginSuccess={handleLoginSuccess} />; }
    if (isLoading) { return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-beleren text-2xl">Načítání...</div>; }
    if (error) { return <div className="min-h-screen bg-gray-900 text-red-500 flex items-center justify-center text-xl">{error}</div>; }
    if (!selectedTemplate && templates.length > 0) {
        setCardData(prev => ({ ...prev, templateId: templates[0].id }));
        return null;
    }
    if (!selectedTemplate) { return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-beleren text-2xl">Žádné šablony nebyly nalezeny.</div>; }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans relative">
            <div className="absolute top-4 right-4 flex flex-wrap gap-2 md:gap-4 z-20">
                <button
                    onClick={() => setDeckManagerOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm md:text-base"
                >
                    Moje balíčky
                </button>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm md:text-base"
                >
                    Odhlásit
                </button>
            </div>

            <header className="w-full max-w-7xl text-center mb-6 pt-16 md:pt-0">
                <h1 className="text-4xl sm:text-5xl font-beleren text-yellow-300">MTG Card Creator</h1>
                <p className="text-gray-400 mt-2">Vytvořte si vlastní Magic: The Gathering karty.</p>
            </header>
            
            <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-2/5 xl:w-1/3 bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700">
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

                <div className="w-full lg:w-3/5 xl:w-2/3 flex flex-col items-center gap-6">
                    <div ref={cardPreviewRef} className="w-full flex justify-center">
                         <CardPreview cardData={cardData} template={selectedTemplate} />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                        <button onClick={() => setAddToDeckModalOpen(true)} className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition order-1">
                            Uložit do balíčku
                        </button>
                        <button onClick={handleDownload} className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-700 text-white font-bold transition order-2">
                            Exportovat PNG
                        </button>
                        <button onClick={handleReset} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-bold transition order-3">
                            Resetovat kartu
                        </button>
                    </div>
                </div>
            </main>

            {isTemplateEditorOpen && (
                <TemplateEditor
                    templates={templates}
                    onSave={handleSaveTemplates}
                    onClose={() => setTemplateEditorOpen(false)}
                />
            )}

            {isAddToDeckModalOpen && (
                <AddToDeckModal 
                    cardData={cardData} 
                    template={selectedTemplate} 
                    onClose={() => setAddToDeckModalOpen(false)} 
                    onDecksUpdated={handleDecksUpdated}
                />
            )}

            {isDeckManagerOpen && (
                <DeckManager onClose={() => setDeckManagerOpen(false)} />
            )}
        </div>
    );
};

export default App;