
import React from 'react';
import { ArtAsset } from '../types';

interface AssetLibraryProps {
    assets: ArtAsset[];
    onSelect: (dataUrl: string) => void;
    onClose: () => void;
}

const AssetLibrary: React.FC<AssetLibraryProps> = ({ assets, onSelect, onClose }) => {
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
                                className="aspect-square bg-gray-900 rounded-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200"
                                onClick={() => onSelect(asset.dataUrl)}
                            >
                                <img src={asset.dataUrl} alt={`Asset ${asset.id}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetLibrary;
