
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
            
            {/* ... zbytek komponenty (modální okna) */}
        </>
    );
};

export default ArtEditor;