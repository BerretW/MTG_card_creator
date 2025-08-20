// client/src/services/assetService.ts
import { ArtAsset, CustomSetSymbol } from '../types';

// const API_URL = 'http://localhost:3001/api'; // URL vašeho back-endu
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

// Funkce pro získání tokenu (implementace závisí na vaší auth logice)
const getAuthToken = () => localStorage.getItem('accessToken');

export const assetService = {
    getArtAssets: async (): Promise<ArtAsset[]> => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/assets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch assets');
        const assets = await response.json();
        // Server vrací { id, url }, my potřebujeme { id, dataUrl } pro kompatibilitu
        return assets.map((asset: any) => ({ id: asset.id, dataUrl: asset.url }));
    },

    addArtAsset: async (dataUrl: string): Promise<ArtAsset> => {
        const token = getAuthToken();
        
        // Převod dataUrl na Blob, který můžeme poslat jako soubor
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append('art', blob, 'art.png');

        const uploadResponse = await fetch(`${API_URL}/assets`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (!uploadResponse.ok) throw new Error('Failed to upload asset');
        const newAsset = await uploadResponse.json();
        return { id: newAsset.id, dataUrl: newAsset.url };
    },
    
    // Ukládání vlastních symbolů zůstává v localStorage pro jednoduchost,
    // ale mohlo by být také přeneseno na server.
    getCustomSetSymbols: async (): Promise<CustomSetSymbol[]> => {
        const stored = localStorage.getItem('customSetSymbols');
        return stored ? JSON.parse(stored) : [];
    },

    addCustomSetSymbol: async (name: string, url: string): Promise<CustomSetSymbol> => {
        const currentSymbols = await assetService.getCustomSetSymbols();
        const newSymbol: CustomSetSymbol = {
            id: `custom-${Date.now()}`,
            name,
            url
        };
        const updatedSymbols = [...currentSymbols, newSymbol];
        localStorage.setItem('customSetSymbols', JSON.stringify(updatedSymbols));
        return newSymbol;
    },
};