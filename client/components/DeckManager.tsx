import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { assetService } from '../services/assetService';
import { Deck, SavedCard } from '../types';
import CardPreview from './CardPreview';

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
        if (!selectedDeck?.cards || selectedDeck.cards.length === 0) return;
        setIsExporting(true);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const CARDS_PER_PAGE = 9;
        const cardChunks = [];

        for (let i = 0; i < selectedDeck.cards.length; i += CARDS_PER_PAGE) {
            cardChunks.push(selectedDeck.cards.slice(i, i + CARDS_PER_PAGE));
        }

        // Vytvoříme dočasný skrytý kontejner pro renderování
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.left = '-9999px';
        printContainer.style.top = '0';
        document.body.appendChild(printContainer);

        try {
            for (let i = 0; i < cardChunks.length; i++) {
                const chunk = cardChunks[i];
                
                // Vytvoříme grid pro aktuální stránku
                const pageGrid = document.createElement('div');
                pageGrid.style.display = 'grid';
                pageGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                pageGrid.style.gap = '5px';
                pageGrid.style.padding = '5px';
                pageGrid.style.backgroundColor = 'white';
                pageGrid.style.width = `${375 * 3 + 20}px`; // Šířka 3 karet + mezery
                printContainer.appendChild(pageGrid);

                const root = ReactDOM.createRoot(pageGrid);
                await new Promise<void>(resolve => {
                    root.render(
                        <React.StrictMode>
                             {chunk.map(savedCard => (
                                <CardPreview 
                                    key={savedCard.id}
                                    cardData={savedCard.card_data} 
                                    template={savedCard.template_data} 
                                />
                            ))}
                        </React.StrictMode>,
                        () => resolve()
                    );
                });

                // Dáme malou pauzu, aby se obrázky stihly načíst
                await new Promise(r => setTimeout(r, 1000)); 

                const dataUrl = await toPng(pageGrid, { pixelRatio: 2 });
                
                if (i > 0) {
                    pdf.addPage();
                }

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

                // Uklidíme po sobě
                root.unmount();
                printContainer.removeChild(pageGrid);
            }

            pdf.save(`${selectedDeck.name.replace(/\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error("Chyba při generování PDF:", error);
            alert("Během exportu do PDF došlo k chybě.");
        } finally {
            // Finální úklid
            document.body.removeChild(printContainer);
            setIsExporting(false);
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
                                                {isExporting ? 'Generuji PDF...' : 'Exportovat balíček do PDF'}
                                            </button>
                                        )}
                                    </div>

                                    {selectedDeck.cards && selectedDeck.cards.length > 0 ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                                            {selectedDeck.cards.map(savedCard => (
                                                <div key={savedCard.id} className="relative group cursor-pointer" onClick={() => setViewingCard(savedCard)}>
                                                    <img 
                                                        src={savedCard.card_data.art.cropped} 
                                                        alt={savedCard.card_data.name} 
                                                        className="w-full rounded-md aspect-[5/7] object-cover bg-gray-900 border-2 border-transparent group-hover:border-yellow-400 transition-all"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <p className="text-white text-xs text-center p-1">{savedCard.card_data.name}</p>
                                                    </div>
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

            {viewingCard && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60]" onClick={() => setViewingCard(null)}>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
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
                </div>
            )}
        </>
    );
};

export default DeckManager;