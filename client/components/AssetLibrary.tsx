import React from 'react';
import { ArtAsset } from '../types';
import { assetService } from '../services/assetService';

interface AssetLibraryProps {
    assets: ArtAsset[];
    onSelect: (dataUrl: string) => void;
    onClose: () => void;
}

const AssetLibrary: React.FC<AssetLibraryProps> = ({ assets, onSelect, onClose }) => {
    const handleDeleteAsset = async (assetId: number, event: React.MouseEvent) => {
        event.stopPropagation(); // Zabraníme spuštění onClick na divu
        if (window.confirm("Opravdu si přejete smazat tento obrázek?")) {
            try {
                await assetService.removeArtAsset(assetId);
                // Zde můžeš provést aktualizaci stavu, aby se obrázek odstranil z UI
                // Například, zavolat funkci, která je předána jako prop, a která aktualizuje `artAssets` v `ArtEditor`
                window.location.reload() //TODO: Refaktorovat
            } catch (error) {
                alert("Chyba při mazání obrázku.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl h-[80vh] border border-gray-700 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-beleren text-yellow-300">Art Asset Library</h3>
                    <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 transition">Close</button>
                </div>
                {assets.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-gray-400">
                        Your library is empty. Upload or generate art to add it here.
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {assets.map(asset => (
                            <div 
                                key={asset.id} 
                                className="relative aspect-square bg-gray-900 rounded-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200"
                                onClick={() => onSelect(asset.dataUrl)}
                            >
                                <img src={asset.dataUrl} alt={`Asset ${asset.id}`} className="w-full h-full object-cover" />
                                <button 
                                    onClick={(event) => handleDeleteAsset(asset.id, event)}
                                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2l2-2h4l2 2h4a1 1 0 011 1v1H5V3a1 1 0 011-1h4zm3 5l1 5h-2l1-5zm-4 0l1 5H4l1-5zm7 0l1 5h-2l1-5zm-5 3h2v4h-2V10zM6 7v9a1 1 0 001 1h6a1 1 0 001-1V7H6z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetLibrary;