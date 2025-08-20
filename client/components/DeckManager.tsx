import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { assetService } from '../services/assetService';
import { Deck, SavedCard, CardData, Template } from '../types';
import CardPreview from './CardPreview';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CARD_WIDTH_MM = 63;
const CARD_HEIGHT_MM = 88;

const drawCropMarks = (doc: jsPDF, x: number, y: number, width: number, height: number) => {
    const len = 4;
    const off = 1;
    doc.setLineWidth(0.1);
    doc.setDrawColor(0);
    doc.line(x - off, y, x - off - len, y);
    doc.line(x, y - off, x, y - off - len);
    doc.line(x + width + off, y, x + width + off + len, y);
    doc.line(x + width, y - off, x + width, y - off - len);
    doc.line(x - off, y + height, x - off - len, y + height);
    doc.line(x, y + height + off, x, y + height + off + len);
    doc.line(x + width + off, y + height, x + width + off + len, y + height);
    doc.line(x + width, y + height + off, x + width, y + height + off + len);
};

const getProxiedUrl = (url: string): string => {
    if (url && url.startsWith('http') && !url.startsWith(window.location.origin) && !url.startsWith(API_URL)) {
        return `${API_URL}/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
};

interface DeckManagerProps {
    onClose: () => void;
    onEditCard: (card: SavedCard) => void;
}

const DeckManager: React.FC<DeckManagerProps> = ({ onClose, onEditCard }) => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingCard, setViewingCard] = useState<SavedCard | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState('');

    const fetchDecks = useCallback(() => {
        setIsLoading(true);
        assetService.getDecks()
            .then(setDecks)
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);
    
    const handleSelectDeck = async (deckId: number) => {
        setIsLoading(true);
        setViewingCard(null);
        try {
            const fullDeck = await assetService.getDeckById(deckId);
            setSelectedDeck(fullDeck);
        } catch (error) {
            alert("Chyba při načítání balíčku.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteDeck = async (deckId: number) => {
        if (!window.confirm("Opravdu si přejete smazat tento balíček? Tato akce je nevratná.")) return;
        
        try {
            await assetService.deleteDeck(deckId);
            setDecks(prev => prev.filter(d => d.id !== deckId));
            if (selectedDeck?.id === deckId) {
                setSelectedDeck(null);
            }
        } catch (error) {
            alert("Chyba při mazání balíčku.");
        }
    };

    const handleRemoveCard = async (cardId: number) => {
        if (!selectedDeck) return;
        try {
            await assetService.removeCardFromDeck(selectedDeck.id, cardId);
            setSelectedDeck(prev => prev ? ({ ...prev, cards: prev.cards?.filter(c => c.id !== cardId) }) : null);
        } catch (error) {
            alert("Chyba při odstraňování karty.");
        }
    };
    
    const handleStartEdit = () => {
        if (viewingCard) {
            onEditCard(viewingCard);
        }
    };

    const handleExportDeckToPdf = async () => {
        const cardsToExport = selectedDeck?.cards;
        if (!cardsToExport || cardsToExport.length === 0) return;
        
        setIsExporting(true);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const CARDS_PER_PAGE = 9;
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;
        const gridWidth = 3 * CARD_WIDTH_MM;
        const gridHeight = 3 * CARD_HEIGHT_MM;
        const marginX = (A4_WIDTH_MM - gridWidth) / 2;
        const marginY = (A4_HEIGHT_MM - gridHeight) / 2;
        
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.left = '-9999px';
        printContainer.style.top = '0';
        document.body.appendChild(printContainer);

        try {
            for (let i = 0; i < cardsToExport.length; i++) {
                setExportProgress(`Zpracovávám kartu ${i + 1}/${cardsToExport.length}...`);
                const savedCard = cardsToExport[i];

                const proxiedCardData: CardData = {
                    ...savedCard.card_data,
                    art: {
                        original: getProxiedUrl(savedCard.card_data.art.original),
                        cropped: getProxiedUrl(savedCard.card_data.art.cropped),
                    },
                    setSymbolUrl: getProxiedUrl(savedCard.card_data.setSymbolUrl),
                };
                const proxiedTemplateData: Template = {
                    ...savedCard.template_data,
                    frameImageUrl: getProxiedUrl(savedCard.template_data.frameImageUrl),
                };

                // Vytvoříme nový, čistý root pro každou kartu
                const root = ReactDOM.createRoot(printContainer);
                await new Promise<void>(resolve => {
                    root.render(
                        <CardPreview cardData={proxiedCardData} template={proxiedTemplateData} />
                    );
                    // Pevná pauza je zde spolehlivější než requestAnimationFrame
                    setTimeout(resolve, 300);
                });
                
                const cardDataUrl = await toPng(printContainer.firstElementChild as HTMLElement, {
                    pixelRatio: 3,
                    quality: 1.0,
                    cacheBust: true, // Důležité pro načtení proxovaných obrázků
                });
                
                // Uklidíme po sobě PŘED další iterací
                root.unmount();
                printContainer.innerHTML = ''; // Pro jistotu

                const cardIndexOnPage = i % CARDS_PER_PAGE;
                if (i > 0 && cardIndexOnPage === 0) {
                    pdf.addPage();
                }

                const row = Math.floor(cardIndexOnPage / 3);
                const col = cardIndexOnPage % 3;
                const x = marginX + col * CARD_WIDTH_MM;
                const y = marginY + row * CARD_HEIGHT_MM;
                
                pdf.addImage(cardDataUrl, 'PNG', x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);
                drawCropMarks(pdf, x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);
            }
            
            setExportProgress("Ukládání PDF...");
            pdf.save(`${selectedDeck.name.replace(/\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error("Chyba při generování PDF:", error);
            alert("Během exportu do PDF došlo k chybě. Více informací naleznete v konzoli.");
        } finally {
            document.body.removeChild(printContainer);
            setIsExporting(false);
            setExportProgress('');
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] border border-gray-700 flex flex-col">
                    <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                        <h3 className="text-xl md:text-2xl font-beleren text-yellow-300">Správce balíčků</h3>
                        <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Zavřít</button>
                    </header>

                    <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                        <aside className="w-full md:w-1/3 lg:w-1/4 bg-gray-900/50 p-4 space-y-2 overflow-y-auto h-1/3 md:h-full">
                            {isLoading && !decks.length && <p>Načítání balíčků...</p>}
                            {decks.map(deck => (
                                <div key={deck.id} onClick={() => handleSelectDeck(deck.id)} className={`p-3 rounded-md cursor-pointer transition-colors ${selectedDeck?.id === deck.id ? 'bg-yellow-400/20' : 'hover:bg-gray-700'}`}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold truncate">{deck.name}</p>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }} className="text-red-500 hover:text-red-400 text-xs ml-2 flex-shrink-0">SMAZAT</button>
                                    </div>
                                </div>
                            ))}
                        </aside>

                        <main className="w-full md:w-2/3 lg:w-3/4 p-4 overflow-y-auto">
                            {isLoading && selectedDeck && <p>Načítání karet...</p>}
                            {!selectedDeck && <p className="text-gray-400 text-center mt-8">Vyberte balíček ze seznamu.</p>}
                            {selectedDeck && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-2xl font-beleren text-yellow-200">{selectedDeck.name}</h4>
                                        {selectedDeck.cards && selectedDeck.cards.length > 0 && (
                                            <button
                                                onClick={handleExportDeckToPdf}
                                                disabled={isExporting}
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm md:text-base disabled:bg-gray-500 disabled:cursor-wait"
                                            >
                                                {isExporting ? exportProgress : 'Exportovat balíček do PDF'}
                                            </button>
                                        )}
                                    </div>

                                    {selectedDeck.cards && selectedDeck.cards.length > 0 ? (
                                        <div 
                                            className="grid gap-5 justify-items-center"
                                            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))' }}
                                        >
                                            {selectedDeck.cards.map(savedCard => (
                                                <div 
                                                    key={savedCard.id} 
                                                    className="relative group cursor-pointer transition-transform duration-200 hover:scale-105 hover:z-10" 
                                                    onClick={() => setViewingCard(savedCard)}
                                                >
                                                    <CardPreview 
                                                        cardData={savedCard.card_data} 
                                                        template={savedCard.template_data} 
                                                        scale={0.6}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400">Tento balíček je prázdný.</p>
                                    )}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>

            <div 
                className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300 ease-in-out
                    ${viewingCard ? 'bg-black bg-opacity-80 opacity-100' : 'bg-opacity-0 opacity-0 pointer-events-none'}`
                }
                onClick={() => setViewingCard(null)}
            >
                <div 
                    className={`transition-all duration-300 ease-in-out
                        ${viewingCard ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`
                    }
                    onClick={(e) => e.stopPropagation()}
                >
                    {viewingCard && (
                        <div className="relative">
                            <CardPreview cardData={viewingCard.card_data} template={viewingCard.template_data} />
                            <div className="mt-4 flex justify-center gap-4">
                                <button 
                                    onClick={handleStartEdit}
                                    className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white font-bold"
                                >
                                    Upravit tuto kartu
                                </button>
                                <button 
                                    onClick={() => handleRemoveCard(viewingCard.id).then(() => setViewingCard(null))}
                                    className="py-2 px-4 rounded-md bg-red-600 hover:bg-red-500 text-white"
                                >
                                    Odebrat z balíčku
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DeckManager;