import React, { useState, useEffect } from 'react';
import { assetService } from '../services/assetService';
import { Deck, SavedCard } from '../types';

interface CopyToDeckModalProps {
    cardToCopy: SavedCard;
    onClose: () => void;
}

const CopyToDeckModal: React.FC<CopyToDeckModalProps> = ({ cardToCopy, onClose }) => {
    const [myDecks, setMyDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        assetService.getDecks()
            .then(data => {
                setMyDecks(data);
                if (data.length > 0) setSelectedDeckId(data[0].id.toString());
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleCopy = async () => {
        if (!selectedDeckId) return;
        setIsLoading(true);
        try {
            await assetService.addCardToDeck(
                parseInt(selectedDeckId), 
                cardToCopy.card_data, 
                cardToCopy.template_data
            );
            alert(`Karta "${cardToCopy.card_data.name}" byla zkopírována.`);
            onClose();
        } catch (error) {
            alert("Chyba při kopírování karty.");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-beleren text-yellow-300 mb-4">Kopírovat kartu do...</h3>
                {isLoading && !myDecks.length ? <p>Načítání balíčků...</p> : (
                    <select 
                        value={selectedDeckId} 
                        onChange={e => setSelectedDeckId(e.target.value)} 
                        className="w-full bg-gray-700 p-2 rounded border border-gray-600"
                        disabled={myDecks.length === 0}
                    >
                        {myDecks.length > 0 ? (
                            myDecks.map(deck => <option key={deck.id} value={deck.id}>{deck.name}</option>)
                        ) : <option>Nemáte žádné vlastní balíčky</option>}
                    </select>
                )}
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} disabled={isLoading} className="py-2 px-4 rounded-md bg-gray-600">Zrušit</button>
                    <button onClick={handleCopy} disabled={isLoading || !selectedDeckId} className="py-2 px-6 rounded-md bg-blue-600 disabled:bg-gray-500">
                        {isLoading ? 'Kopíruji...' : 'Zkopírovat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CopyToDeckModal;