import React from 'react';
import { MANA_SYMBOLS } from '../constants';

const AVAILABLE_SYMBOLS: { key: string; label: string; preview: string }[] = [
    { key: "W", label: "White Mana", preview: MANA_SYMBOLS["W"] },
    { key: "U", label: "Blue Mana", preview: MANA_SYMBOLS["U"] },
    { key: "B", label: "Black Mana", preview: MANA_SYMBOLS["B"] },
    { key: "R", label: "Red Mana", preview: MANA_SYMBOLS["R"] },
    { key: "G", label: "Green Mana", preview: MANA_SYMBOLS["G"] },
    { key: "C", label: "Colorless", preview: MANA_SYMBOLS["C"] },
    { key: "T", label: "Tap", preview: MANA_SYMBOLS["T"] },
    { key: "UT", label: "Untap", preview: MANA_SYMBOLS["UT"] },
    { key: "H", label: "Half", preview: MANA_SYMBOLS["H"] },
    { key: "W/P", label: "Phyrexian White", preview: MANA_SYMBOLS["W/P"] },
    { key: "U/P", label: "Phyrexian Blue", preview: MANA_SYMBOLS["U/P"] },
    { key: "B/P", label: "Phyrexian Black", preview: MANA_SYMBOLS["B/P"] },
    { key: "R/P", label: "Phyrexian Red", preview: MANA_SYMBOLS["R/P"] },
    { key: "G/P", label: "Phyrexian Green", preview: MANA_SYMBOLS["G/P"] },
    { key: "W/U", label: "White/Blue", preview: MANA_SYMBOLS["W/U"] },
    { key: "W/B", label: "White/Black", preview: MANA_SYMBOLS["W/B"] },
    { key: "R/W", label: "Red/White", preview: MANA_SYMBOLS["R/W"] },
    { key: "G/W", label: "Green/White", preview: MANA_SYMBOLS["G/W"] },
    { key: "U/B", label: "Blue/Black", preview: MANA_SYMBOLS["U/B"] },
    { key: "U/R", label: "Blue/Red", preview: MANA_SYMBOLS["U/R"] },
    { key: "G/U", label: "Green/Blue", preview: MANA_SYMBOLS["G/U"] },
    { key: "B/R", label: "Black/Red", preview: MANA_SYMBOLS["B/R"] },
    { key: "B/G", label: "Black/Green", preview: MANA_SYMBOLS["B/G"] },
    { key: "R/G", label: "Red/Green", preview: MANA_SYMBOLS["R/G"] },
];

interface SymbolPaletteProps {
    onSymbolClick: (symbol: string) => void;
}

const SymbolPalette: React.FC<SymbolPaletteProps> = ({ onSymbolClick }) => {
    
    const handleMouseDown = (e: React.MouseEvent, symbol: string) => {
        // Zabráníme tomu, aby div získal focus a "ukradl" ho z textového pole
        e.preventDefault();
        onSymbolClick(symbol);
    };

    return (
        <div className="bg-gray-800 p-4 rounded-2xl shadow-2xl border border-gray-700 h-full flex flex-col">
            <h3 className="text-xl font-beleren text-yellow-200 border-b-2 border-yellow-200/20 pb-2 mb-4">
                Mana symboly
            </h3>
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {AVAILABLE_SYMBOLS.map((sym) => (
                        <div
                            key={sym.key}
                            title={`Vložit symbol: {${sym.key}}`}
                            onMouseDown={(e) => handleMouseDown(e, sym.key)}
                            className="aspect-square bg-gray-700 hover:bg-gray-600 flex items-center justify-center rounded-md cursor-pointer border border-gray-500 transition-colors"
                        >
                            {/* ======================= ZMĚNA ZDE: Použití <img> tagu ======================= */}
                            {sym.preview ? (
                                <img 
                                    src={sym.preview} 
                                    alt={sym.label} 
                                    className="w-8 h-8" 
                                />
                            ) : null}
                        </div>
                    ))}
                    {/* Číselné symboly */}
                    {Array.from({ length: 17 }, (_, i) => {
                        const numStr = i.toString();
                        const imageUrl = MANA_SYMBOLS[numStr];

                        return (
                            <div
                                key={numStr}
                                title={`Vložit symbol: {${numStr}}`}
                                onMouseDown={(e) => handleMouseDown(e, numStr)}
                                className="aspect-square bg-gray-700 hover:bg-gray-600 flex items-center justify-center rounded-md cursor-pointer border border-gray-500 transition-colors"
                            >
                                {/* ======================= ZMĚNA ZDE: Také používá <img> pro konzistenci ======================= */}
                                {imageUrl ? (
                                    <img src={imageUrl} alt={numStr} className="w-8 h-8" />
                                ) : (
                                    // Fallback, pokud by obrázek neexistoval
                                    <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-xl">{i}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SymbolPalette;