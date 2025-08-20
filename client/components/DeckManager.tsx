import React, { useState, useEffect, useCallback } from 'react';
import { assetService } from '../services/assetService';
import { Deck, SavedCard } from '../types';
import CardPreview from './CardPreview';

interface DeckManagerProps {
    onClose: () => void;
}

const DeckManager: React.FC<DeckManagerProps> = ({ onClose }) => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
            // Aktualizujeme stav bez nového volání API
            setSelectedDeck(prev => prev ? ({ ...prev, cards: prev.cards?.filter(c => c.id !== cardId) }) : null);
        } catch (error) {
            alert("Chyba při odstraňování karty.");
        }
    };

    return (
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
                            <div 
                                key={deck.id} 
                                onClick={() => handleSelectDeck(deck.id)}
                                className={`p-3 rounded-md cursor-pointer transition-colors ${selectedDeck?.id === deck.id ? 'bg-yellow-400/20' : 'hover:bg-gray-700'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <p className="font-bold truncate">{deck.name}</p>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                                        className="text-red-500 hover:text-red-400 text-xs ml-2"
                                    >
                                        SMAZAT
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400 truncate">{deck.description}</p>
                            </div>
                        ))}
                    </aside>

                    <main className="w-full md:w-2/3 lg:w-3/4 p-4 overflow-y-auto">
                        {isLoading && selectedDeck && <p>Načítání karet...</p>}
                        {!selectedDeck && <p className="text-gray-400 text-center mt-8">Vyberte balíček ze seznamu pro zobrazení jeho obsahu.</p>}
                        {selectedDeck && (
                            <div>
                                <h4 className="text-2xl font-beleren text-yellow-200 mb-4">{selectedDeck.name}</h4>
                                {selectedDeck.cards && selectedDeck.cards.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {selectedDeck.cards.map(savedCard => (
                                            <div key={savedCard.id} className="relative group">
                                                <div className="transform scale-[0.3] sm:scale-100 origin-top-left">
                                                    <CardPreview cardData={savedCard.card_data} template={savedCard.template_data} />
                                                </div>
                                                <button 
                                                    onClick={() => handleRemoveCard(savedCard.id)}
                                                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
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
    );
};

export default DeckManager;