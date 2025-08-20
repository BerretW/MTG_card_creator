import React, { useState, useCallback } from 'react';
import { generateArt } from '../services/geminiService';
import ArtCropper from './ArtCropper';
import AssetLibrary from './AssetLibrary';
import { ArtAsset, CardArt } from '../types'; // Přidáme CardArt

interface ArtEditorProps {
    art: CardArt; // << ZMĚNA
    setArt: (art: CardArt) => void; // << ZMĚNA
    artAssets: ArtAsset[];
    onArtUpdate: (originalUrl: string, croppedUrl: string) => void; // << ZMĚNA
    aspectRatio: number;
}

interface AIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => void; // Added callback prop
    isLoading: boolean;
    error: string | null;
}

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onGenerate, isLoading, error }) => {
    const [prompt, setPrompt] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700 flex flex-col">
                <h3 className="text-xl font-beleren text-yellow-300 mb-4">Generovat obrázek pomocí AI</h3>
                {error && <p className="text-red-500">{error}</p>}
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white mb-4"
                    placeholder="Zadejte popis obrázku..."
                    rows={4}
                />
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Zrušit</button>
                    <button onClick={() => onGenerate(prompt)} disabled={isLoading} className="py-2 px-6 rounded-md bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500">
                        {isLoading ? 'Generuji...' : 'Generovat'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ArtEditor: React.FC<ArtEditorProps> = ({ art, setArt, artAssets, onArtUpdate, aspectRatio }) => {
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [croppingImageUrl, setCroppingImageUrl] = useState<string | null>(null);

    const [aiPrompt, setAiPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCroppingImageUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleArtSelectedFromLibrary = (dataUrl: string) => {
        setCroppingImageUrl(dataUrl);
        setIsLibraryOpen(false);
    };

    const handleGenerateArt = async () => {
        if (!aiPrompt) return;
        setIsLoading(true);
        setError(null);
        try {
            const generatedImageUrl = await generateArt(aiPrompt);
            setCroppingImageUrl(generatedImageUrl); // Go to cropper after generation
            setIsAiModalOpen(false);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
     const handleCropComplete = (croppedDataUrl: string) => {
        // croppingImageUrl stále drží původní obrázek!
        if (croppingImageUrl) {
            onArtUpdate(croppingImageUrl, croppedDataUrl);
        }
        setCroppingImageUrl(null); // Zavřeme ořezávač
    };

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
                    {/* --- NOVÉ TLAČÍTKO --- */}
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
                <AIModal
                    isOpen={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    onGenerate={handleGenerateArt}
                    isLoading={isLoading}
                    error={error}
                />
            )}
        </>
    );
};

export default ArtEditor;