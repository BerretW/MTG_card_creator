
import { ArtAsset, CustomSetSymbol } from '../types';

const DB_NAME = 'MTGCardCreatorDB';
const DB_VERSION = 1;
const ART_STORE_NAME = 'artAssets';
const SYMBOL_STORAGE_KEY = 'customSetSymbols';

let db: IDBDatabase;

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("IndexedDB error:", request.error);
            reject("Error opening DB");
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = () => {
            const newDb = request.result;
            if (!newDb.objectStoreNames.contains(ART_STORE_NAME)) {
                newDb.createObjectStore(ART_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

const getArtAssets = async (): Promise<ArtAsset[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ART_STORE_NAME, 'readonly');
        const store = transaction.objectStore(ART_STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject("Error fetching assets");
        request.onsuccess = () => {
            // Return in reverse chronological order
            resolve(request.result.reverse());
        };
    });
};

const addArtAsset = async (dataUrl: string): Promise<ArtAsset> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ART_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(ART_STORE_NAME);
        const newAsset = { dataUrl };
        const request = store.add(newAsset);

        request.onerror = () => reject("Error adding asset");
        request.onsuccess = () => {
            resolve({ id: request.result as number, dataUrl });
        };
    });
};


const getCustomSetSymbols = async (): Promise<CustomSetSymbol[]> => {
    const stored = localStorage.getItem(SYMBOL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

const addCustomSetSymbol = async (name: string, url: string): Promise<CustomSetSymbol> => {
    const currentSymbols = await getCustomSetSymbols();
    const newSymbol: CustomSetSymbol = {
        id: `custom-${Date.now()}`,
        name,
        url
    };
    const updatedSymbols = [...currentSymbols, newSymbol];
    localStorage.setItem(SYMBOL_STORAGE_KEY, JSON.stringify(updatedSymbols));
    return newSymbol;
};

export const assetService = {
    getArtAssets,
    addArtAsset,
    getCustomSetSymbols,
    addCustomSetSymbol,
};
