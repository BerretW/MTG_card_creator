import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { CardData, Template, ArtAsset, CustomSetSymbol, CardArt } from './types';
import EditorPanel from './components/EditorPanel';
import CardPreview from './components/CardPreview';
import TemplateEditor from './components/TemplateEditor';
import Auth from './components/Auth';
import { DEFAULT_CARD_DATA, DEFAULT_TEMPLATES } from './constants';
import { assetService } from './services/assetService';

const App: React.FC = () => {
    // --- Autentizace ---
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));

    // --- Stavy aplikace ---
    const [cardData, setCardData] = useState<CardData>(DEFAULT_CARD_DATA);
    const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
    const [isTemplateEditorOpen, setTemplateEditorOpen] = useState(false);
    const [artAssets, setArtAssets] = useState<ArtAsset[]>([]);
    const [customSetSymbols, setCustomSetSymbols] = useState<CustomSetSymbol[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cardPreviewRef = useRef<HTMLDivElement>(null);
    
    // Načítání dat po přihlášení (změně tokenu)
    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [loadedAssets, loadedSymbols] = await Promise.all([
                    assetService.getArtAssets(),
                    assetService.getCustomSetSymbols()
                ]);
                setArtAssets(loadedAssets);
                setCustomSetSymbols(loadedSymbols);
            } catch (err: any) {
                console.error("Failed to load user data:", err);
                setError("Nepodařilo se načíst data. Váš token mohl vypršet.");
                handleLogout(); // Odhlásíme uživatele při chybě
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [token]);

    // --- Správa sezení ---
    const handleLoginSuccess = (newToken: string) => {
        localStorage.setItem('accessToken', newToken);
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setToken(null);
        setArtAssets([]);
        setCustomSetSymbols([]);
    };

    // --- Handlery pro data ---
    const handleArtUpdate = (originalUrl: string, croppedUrl: string) => {
        // 1. Aktualizujeme stav karty v reálném čase
        setCardData(prev => ({
            ...prev,
            art: {
                original: originalUrl,
                cropped: croppedUrl
            }
        }));

        // 2. Oříznutou verzi uložíme do knihovny na serveru
        assetService.addArtAsset(croppedUrl)
            .then(newAsset => {
                setArtAssets(prev => [newAsset, ...prev]);
            })
            .catch(error => {
                console.error("Failed to add art asset to library:", error);
                alert("Chyba: Nepodařilo se nahrát obrázek do knihovny na serveru.");
            });
    };

    const handleAddCustomSetSymbol = async (name: string, dataUrl: string) => {
        const newSymbol = await assetService.addCustomSetSymbol(name, dataUrl);
        setCustomSetSymbols(prev => [...prev, newSymbol]);
        setCardData(prev => ({ ...prev, setSymbolUrl: newSymbol.url }));
    };

    const handleDownload = useCallback(() => {
        if (cardPreviewRef.current === null) return;
        toPng(cardPreviewRef.current, { cacheBust: true, pixelRatio: 2, quality: 1.0 })
            .then((dataUrl) => {
                const safeCardName = cardData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'mtg_card';
                const link = document.createElement('a');
                link.download = `${safeCardName}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => console.error('Failed to generate card image', err));
    }, [cardPreviewRef, cardData.name]);
    
    const handleReset = () => setCardData(DEFAULT_CARD_DATA);

    const handleSaveTemplates = (updatedTemplates: Template[]) => {
        setTemplates(updatedTemplates);
        if (!updatedTemplates.some(t => t.id === cardData.templateId)) {
            setCardData(prev => ({ ...prev, templateId: updatedTemplates[0]?.id || '' }));
        }
    };

    const selectedTemplate = templates.find(t => t.id === cardData.templateId) || templates[0];
    
    // --- Podmíněné renderování ---
    if (!token) {
        return <Auth onLoginSuccess={handleLoginSuccess} />;
    }
    
    if (isLoading) {
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-beleren text-2xl">Načítání...</div>;
    }
    
    if (error) {
        return <div className="min-h-screen bg-gray-900 text-red-500 flex items-center justify-center text-xl">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans relative">
            <button
                onClick={handleLogout}
                className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg z-10"
            >
                Odhlásit
            </button>

            <header className="w-full max-w-7xl text-center mb-6">
                <h1 className="text-4xl sm:text-5xl font-beleren text-yellow-300 tracking-wider">MTG Card Creator</h1>
                <p className="text-gray-400 mt-2">Design your custom Magic: The Gathering cards with a live preview and AI-powered art generation.</p>
            </header>
            
            <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-8">
                <div className="lg:w-2/5 xl:w-1/3 bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700">
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

                <div className="lg:w-3/5 xl:w-2/3 flex flex-col items-center gap-6">
                    <div ref={cardPreviewRef}>
                         <CardPreview cardData={cardData} template={selectedTemplate} />
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                        <button
                            onClick={handleDownload}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            Export as PNG
                        </button>
                        <button
                            onClick={handleReset}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7V9a1 1 0 01-2 0V3a1 1 0 011-1zm.004 9.053a1 1 0 01.996.996 5.002 5.002 0 008.992 2.262 1 1 0 111.885.666A7.002 7.002 0 015.999 17.899V15a1 1 0 012 0v2a1 1 0 01-1 1h-2a1 1 0 010-2h.004z" clipRule="evenodd" /></svg>
                            Reset Card
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
        </div>
    );
};

export default App;