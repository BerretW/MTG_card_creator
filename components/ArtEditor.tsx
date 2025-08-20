
import React, { useState, useCallback } from 'react';
import { generateArt } from '../services/geminiService';
import { ArtAsset } from '../types';
import ArtCropper from './ArtCropper';
import AssetLibrary from './AssetLibrary';

interface ArtEditorProps {
    artUrl: string;
    setArtUrl: (url: string) => void;
    artAssets: ArtAsset[];
    onArtFinalized: (dataUrl: string) => void;
    aspectRatio: number;
}

const ArtEditor: React.FC<ArtEditorProps> = ({ artUrl, setArtUrl, artAssets, onArtFinalized, aspectRatio }) => {
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
        setArtUrl(croppedDataUrl);
        onArtFinalized(croppedDataUrl); // Save to the library
        setCroppingImageUrl(null); // Close cropper
    };

    return (
        <>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <label className="block text-sm font-medium text-gray-300 mb-2">Card Art</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md transition text-center text-sm">
                        Upload
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <button onClick={() => setIsLibraryOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-md transition text-sm">
                        Library
                    </button>
                    <button onClick={() => setIsAiModalOpen(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md transition text-sm">
                        Generate AI
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
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-xl font-beleren text-yellow-300 mb-4">Generate AI Art</h3>
                        <p className="text-gray-400 mb-4">Describe the art you want to create. Be descriptive for the best results!</p>
                        <textarea
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                            rows={3}
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="A wise dragon overlooking a crystal valley..."
                        />
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={() => setIsAiModalOpen(false)} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 transition">Cancel</button>
                            <button onClick={handleGenerateArt} disabled={isLoading} className="py-2 px-6 rounded-md bg-purple-600 hover:bg-purple-700 transition disabled:bg-purple-800 disabled:cursor-not-allowed flex items-center">
                                {isLoading ? "Generating..." : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ArtEditor;
