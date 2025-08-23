import React, { useState, useEffect, useCallback } from 'react';
import { assetService } from '../services/assetService';
import { Deck, SavedCard } from '../types';
import CardPreview from './CardPreview';
import CopyToDeckModal from './CopyToDeckModal'; // Importujeme nový modál

interface PublicDeckViewerProps {
    onClose: () => void;
}

const PublicDeckViewer: React.FC<PublicDeckViewerProps> = ({ onClose }) => {
    const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cardToCopy, setCardToCopy] = useState<SavedCard | null>(null);

    useEffect(() => {
        setIsLoading(true);
        assetService.getPublicDecks()
            .then(setPublicDecks)
            .finally(() => setIsLoading(false));
    }, []);
    
    const handleSelectDeck = async (deckId: number) => {
        setIsLoading(true);
        try {
            const fullDeck = await assetService.getPublicDeckById(deckId);
            setSelectedDeck(fullDeck);
        } catch (error) {
            alert("Chyba při načítání balíčku.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] border border-gray-700 flex flex-col">
                    <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl md:text-2xl font-beleren text-yellow-300">Veřejné balíčky</h3>
                        <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Zavřít</button>
                    </header>

                    <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                        <aside className="w-full md:w-1/3 lg:w-1/4 bg-gray-900/50 p-4 space-y-2 overflow-y-auto h-1/3 md:h-full">
                            {isLoading && !publicDecks.length && <p>Načítání balíčků...</p>}
                            {publicDecks.map(deck => (
                                <div key={deck.id} onClick={() => handleSelectDeck(deck.id)} className={`p-3 rounded-md cursor-pointer transition-colors ${selectedDeck?.id === deck.id ? 'bg-yellow-400/20' : 'hover:bg-gray-700'}`}>
                                    <p className="font-bold truncate">{deck.name}</p>
                                    <p className="text-xs text-gray-400">od {deck.authorUsername}</p>
                                </div>
                            ))}
                        </aside>

                        <main className="w-full md:w-2/3 lg:w-3/4 p-4 overflow-y-auto">
                            {!selectedDeck && <p className="text-gray-400 text-center mt-8">Vyberte balíček ze seznamu.</p>}
                            {selectedDeck && (
                                <div>
                                    <h4 className="text-2xl font-beleren text-yellow-200 mb-4">{selectedDeck.name}</h4>
                                    {selectedDeck.cards && selectedDeck.cards.length > 0 ? (
                                        <div className="grid gap-5 justify-items-center" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))' }}>
                                            {selectedDeck.cards.map(savedCard => (
                                                <div key={savedCard.id} className="relative group cursor-pointer" onClick={() => setCardToCopy(savedCard)}>
                                                    <CardPreview cardData={savedCard.card_data} template={savedCard.template_data} scale={0.6} />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
                                                        <span className="text-white font-bold opacity-0 group-hover:opacity-100">Zkopírovat</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-gray-400">Tento balíček je prázdný.</p>}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
            {cardToCopy && <CopyToDeckModal cardToCopy={cardToCopy} onClose={() => setCardToCopy(null)} />}
        </>
    );
};

export default PublicDeckViewer;