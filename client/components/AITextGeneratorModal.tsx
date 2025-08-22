import React, { useState } from 'react';
import { ApiProvider, CardTextResult, generateCardText } from '../services/aiService';
import { useAppStore } from '../store/appStore';

interface AITextGeneratorModalProps {
    onClose: () => void;
    onGenerate: (result: CardTextResult) => void;
}

const AITextGeneratorModal: React.FC<AITextGeneratorModalProps> = ({ onClose, onGenerate }) => {
    const cardData = useAppStore(state => state.cardData);
    
    const [powerLevel, setPowerLevel] = useState<'slabá' | 'normální' | 'silná' | 'broken'>('normální');
    const [theme, setTheme] = useState('');
    const [apiProvider, setApiProvider] = useState<ApiProvider>('gemini');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!theme.trim()) {
            setError("Zadejte prosím motiv karty.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateCardText(apiProvider, cardData, powerLevel, theme);
            onGenerate(result);
            onClose();
        } catch (err: any) {
            setError(err.message || "Došlo k neznámé chybě.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-gray-700 flex flex-col">
                <h3 className="text-xl font-beleren text-yellow-300 mb-4">Generovat text pomocí AI</h3>
                
                <div className="space-y-4">
                    <fieldset>
                        <legend className="block text-sm font-medium text-gray-300 mb-2">Vyberte službu</legend>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="apiProvider" value="gemini" checked={apiProvider === 'gemini'} onChange={() => setApiProvider('gemini')} className="h-4 w-4 bg-gray-700 border-gray-600 text-yellow-400 focus:ring-yellow-500"/>
                                <span className="text-gray-200">Google Gemini</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="apiProvider" value="openai" checked={apiProvider === 'openai'} onChange={() => setApiProvider('openai')} className="h-4 w-4 bg-gray-700 border-gray-600 text-yellow-400 focus:ring-yellow-500"/>
                                <span className="text-gray-200">OpenAI (GPT)</span>
                            </label>
                        </div>
                    </fieldset>
                    
                    <div>
                        <label htmlFor="powerLevel" className="block text-sm font-medium text-gray-300 mb-1">Požadovaná síla karty</label>
                        <select
                            id="powerLevel"
                            value={powerLevel}
                            onChange={(e) => setPowerLevel(e.target.value as any)}
                            className="w-full bg-gray-700 p-2 rounded border border-gray-600"
                        >
                            <option value="slabá">Slabá / Běžná</option>
                            <option value="normální">Normální / Vyvážená</option>
                            <option value="silná">Silná / Vzácná</option>
                            <option value="broken">Extrémně silná (Broken)</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-1">
                            Motiv nebo popis karty
                        </label>
                        <textarea
                            id="theme"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                            rows={3}
                            placeholder="Např. 'Goblin, který omylem vynalezl stroj na nekonečno klobás.'"
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} disabled={isLoading} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 transition disabled:opacity-50">Zrušit</button>
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || !theme.trim()}
                        className="py-2 px-6 rounded-md bg-purple-600 hover:bg-purple-700 transition disabled:bg-gray-500 disabled:cursor-wait"
                    >
                        {isLoading ? 'Generuji...' : 'Generovat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AITextGeneratorModal;