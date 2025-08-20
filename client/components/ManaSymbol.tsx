import React from 'react';
import { MANA_SYMBOLS } from '../constants';

interface ManaSymbolProps {
    symbol: string;
    className?: string;
}

const ManaSymbol: React.FC<ManaSymbolProps> = ({ symbol, className = 'h-6 w-6' }) => {
    const upperSymbol = symbol.toUpperCase();
    
    // --- OPRAVA: Používáme <span> místo <div> pro inline zobrazení ---
    if (MANA_SYMBOLS[upperSymbol]) {
        return (
            <span
                className={`${className} inline-block`} // Přidáme inline-block pro správné rozměry
                dangerouslySetInnerHTML={{ __html: MANA_SYMBOLS[upperSymbol] }}
            />
        );
    }
    
    if (!isNaN(Number(symbol))) {
        return (
            <span className={`${className} inline-flex items-center justify-center`}>
                <svg viewBox="0 0 100 100" className="h-full w-full">
                    <circle cx="50" cy="50" r="48" fill="#cccccc" stroke="#000" strokeWidth="4"></circle>
                    <text x="50" y="68" fontSize="60" textAnchor="middle" fill="#000" fontWeight="bold">{symbol}</text>
                </svg>
            </span>
        );
    }

    return null;
};

export default ManaSymbol;