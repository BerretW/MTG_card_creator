import React, { useState } from 'react';
import { generateArt, ApiProvider } from '../services/aiService';
import ArtCropper from './ArtCropper';
import AssetLibrary from './AssetLibrary';
import { ArtAsset, CardArt } from '../types'; // Přidáme import typů
import imageCompression from 'browser-image-compression';

// Props se vrací zpět!
interface ArtEditorProps {
    art: CardArt | undefined; // Může být undefined
    artAssets: ArtAsset[];
    onArtUpdate: (originalUrl: string, croppedUrl: string) => void;
    aspectRatio: number;
}

const ArtEditor: React.FC<ArtEditorProps> = ({ art, artAssets, onArtUpdate, aspectRatio }) => {
    // Lokální stavy zůstávají
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [croppingImageUrl, setCroppingImageUrl] = useState<string | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [apiProvider, setApiProvider] = useState<ApiProvider>('gemini');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // ... (tato funkce zůstává beze změny)
        const file = event.target.files?.[0];
        if (file) {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 800,
                useWebWorker: true
            };
            try {
                const compressedFile = await imageCompression(file, options);
                const reader = new FileReader();
                reader.onload = (e) => {
                    setCroppingImageUrl(e.target?.result as string);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Error compressing image:", error);
            }
        }
    };
    
    const handleArtSelectedFromLibrary = (dataUrl: string) => {
        setCroppingImageUrl(dataUrl);
        setIsLibraryOpen(false);
    };

    const handleGenerateArt = async () => {
        // ... (tato funkce zůstává beze změny)
        if (!aiPrompt) return;
        setIsLoading(true);
        setError(null);
        try {
            const generatedImageUrl = await generateArt(aiPrompt, apiProvider);
            setCroppingImageUrl(generatedImageUrl);
            setIsAiModalOpen(false);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Nyní voláme onArtUpdate z props, ne ze store
    const handleCropComplete = (croppedDataUrl: string) => {
        if (croppingImageUrl) {
            onArtUpdate(croppingImageUrl, croppedDataUrl);
        }
        setCroppingImageUrl(null);
    };
    
    // "Loading skeleton", pokud `art` není definován
    if (!art) {
        return (
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <label className="block text-sm font-medium text-gray-300 mb-2">Card Art</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-pulse">
                    <div className="h-10 bg-gray-600 rounded-md"></div>
                    <div className="h-10 bg-gray-600 rounded-md"></div>
                    <div className="h-10 bg-gray-600 rounded-md"></div>
                    <div className="h-10 bg-gray-600 rounded-md"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <label className="block text-sm font-medium text-gray-300 mb-2">Card Art</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md transition text-center text-sm flex items-center justify-center">
                        Upload
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <button onClick={() => setIsLibraryOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-md transition text-sm">
                        Knihovna
                    </button>
                    <button onClick={() => setIsAiModalOpen(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md transition text-sm">
                        Generate AI
                    </button>
                    <button 
                        onClick={() => setCroppingImageUrl(art.original)} 
                        disabled={!art.original}
                        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-md transition text-sm disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        Upravit ořez
                    </button>
                </div>
            </div>

            {croppingImageUrl && (
                <ArtCropper
                    imageUrl={croppingImageUrl}
                    aspectRatio={aspectRatio}
                    onCrop={handleCropComplete}
                    onClose={() => setCroppingImageUrl(null)}
                />
            )}

            {isLibraryOpen && (
                <AssetLibrary
                    assets={artAssets}
                    onSelect={handleArtSelectedFromLibrary}
                    onClose={() => setIsLibraryOpen(false)}
                />
            )}
            
            {isAiModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-gray-700 flex flex-col">
                        <h3 className="text-xl font-beleren text-yellow-300 mb-4">Generovat obrázek pomocí AI</h3>
                        
                        <fieldset className="mb-4">
                            <legend className="block text-sm font-medium text-gray-300 mb-2">Vyberte službu</legend>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="apiProvider" value="gemini" checked={apiProvider === 'gemini'} onChange={() => setApiProvider('gemini')} className="h-4 w-4 bg-gray-700 border-gray-600 text-yellow-400 focus:ring-yellow-500"/>
                                    <span className="text-gray-200">Google Gemini</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="apiProvider" value="openai" checked={apiProvider === 'openai'} onChange={() => setApiProvider('openai')} className="h-4 w-4 bg-gray-700 border-gray-600 text-yellow-400 focus:ring-yellow-500"/>
                                    <span className="text-gray-200">OpenAI (DALL-E 3)</span>
                                </label>
                            </div>
                        </fieldset>

                        <p className="text-gray-400 text-sm mb-1">
                            Zadejte popis obrázku (nejlépe v angličtině):
                        </p>
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                            rows={4}
                            placeholder="Např. 'A wise old wizard casting a spell in a dark library'"
                        />
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={() => setIsAiModalOpen(false)} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 transition">Zrušit</button>
                            <button 
                                onClick={handleGenerateArt} 
                                disabled={isLoading || !aiPrompt}
                                className="py-2 px-6 rounded-md bg-purple-600 hover:bg-purple-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Generuji...' : 'Generovat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ArtEditor;