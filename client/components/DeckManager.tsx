import React, { useState, useEffect, useCallback } from 'react';
import { assetService } from '../services/assetService';
import { Deck, SavedCard } from '../types';
import CardPreview from './CardPreview';

interface DeckManagerProps {
    onClose: () => void;
    onEditCard: (card: SavedCard) => void; // Nová prop pro odeslání karty k úpravě
}

const DeckManager: React.FC<DeckManagerProps> = ({ onClose, onEditCard }) => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Nový stav pro zobrazení detailu karty
    const [viewingCard, setViewingCard] = useState<SavedCard | null>(null);

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
        setViewingCard(null); // Skryjeme detail karty při změně balíčku
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
                                    <h4 className="text-2xl font-beleren text-yellow-200 mb-4">{selectedDeck.name}</h4>
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

            {/* Modální okno pro detailní náhled karty */}
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