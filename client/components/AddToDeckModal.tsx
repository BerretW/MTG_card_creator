import React, { useState, useEffect } from 'react';
import { assetService } from '../services/assetService';
import { CardData, Deck, Template } from '../types';

interface AddToDeckModalProps {
    cardData: CardData;
    template: Template;
    onClose: () => void;
    onDecksUpdated: () => void; // Pro obnovení seznamu balíčků v DeckManageru
}

const AddToDeckModal: React.FC<AddToDeckModalProps> = ({ cardData, template, onClose, onDecksUpdated }) => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');

    useEffect(() => {
        assetService.getDecks()
            .then(data => {
                setDecks(data);
                if (data.length > 0) {
                    setSelectedDeckId(data[0].id.toString());
                }
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        if (!selectedDeckId) {
            alert("Vyberte prosím balíček.");
            return;
        }
        setIsLoading(true);
        try {
            await assetService.addCardToDeck(parseInt(selectedDeckId), cardData, template);
            alert(`Karta "${cardData.name}" byla úspěšně uložena!`);
            onClose();
        } catch (error) {
            alert("Chyba při ukládání karty.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAndSave = async () => {
        if (!newDeckName.trim()) {
            alert("Zadejte název nového balíčku.");
            return;
        }
        setIsLoading(true);
        try {
            const newDeck = await assetService.createDeck(newDeckName, '');
            await assetService.addCardToDeck(newDeck.id, cardData, template);
            alert(`Karta "${cardData.name}" byla uložena do nového balíčku "${newDeck.name}"!`);
            onDecksUpdated();
            onClose();
        } catch (error) {
            alert("Chyba při vytváření balíčku a ukládání karty.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700 flex flex-col">
                <h3 className="text-xl font-beleren text-yellow-300 mb-4">Uložit kartu do balíčku</h3>
                
                {isLoading && <p>Načítání...</p>}
                
                {!isLoading && !isCreating && (
                    <>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Vyberte balíček</label>
                                <select 
                                    value={selectedDeckId} 
                                    onChange={e => setSelectedDeckId(e.target.value)} 
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600"
                                    disabled={decks.length === 0}
                                >
                                    {decks.length > 0 ? (
                                        decks.map(deck => <option key={deck.id} value={deck.id}>{deck.name}</option>)
                                    ) : (
                                        <option>Nemáte žádné balíčky</option>
                                    )}
                                </select>
                            </div>
                             <button onClick={() => setIsCreating(true)} className="w-full text-yellow-400 hover:underline text-sm">... nebo vytvořit nový balíček</button>
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Zrušit</button>
                            <button onClick={handleSave} disabled={!selectedDeckId} className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-700 disabled:bg-gray-500">Uložit</button>
                        </div>
                    </>
                )}

                {!isLoading && isCreating && (
                     <>
                        <div className="space-y-4">
                           <label className="block text-sm font-medium text-gray-300 mb-1">Název nového balíčku</label>
                           <input 
                                type="text"
                                value={newDeckName}
                                onChange={e => setNewDeckName(e.target.value)}
                                className="w-full bg-gray-700 p-2 rounded border border-gray-600"
                                placeholder="Např. Můj modrý balíček"
                           />
                           <button onClick={() => setIsCreating(false)} className="w-full text-yellow-400 hover:underline text-sm">... nebo vybrat existující</button>
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Zrušit</button>
                            <button onClick={handleCreateAndSave} disabled={!newDeckName.trim()} className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-700 disabled:bg-gray-500">Vytvořit a Uložit</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddToDeckModal;