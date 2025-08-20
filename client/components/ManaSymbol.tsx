import React from 'react';
import { MANA_SYMBOLS } from '../constants';

interface ManaSymbolProps {
    symbol: string;
    className?: string;
}

const ManaSymbol: React.FC<ManaSymbolProps> = ({ symbol, className = 'h-6 w-6' }) => {
    const upperSymbol = symbol.toUpperCase();
    
    if (MANA_SYMBOLS[upperSymbol]) {
        return (
            <span
                className={`${className} inline-block`}
                dangerouslySetInnerHTML={{ __html: MANA_SYMBOLS[upperSymbol] }}
            />
        );
    }
    
    // --- ÚPRAVA: Číselné symboly nyní také používají gradient ---
    if (!isNaN(Number(symbol))) {
        return (
            <span className={`${className} inline-flex items-center justify-center`}>
                <svg viewBox="0 0 100 100" className="h-full w-full">
                    {/* Definice gradientu je stejná jako pro bezbarvou manu */}
                    <defs>
                        <radialGradient id="gradC" cx="50%" cy="40%" r="50%" fx="50%" fy="40%">
                            <stop offset="0%" style={{stopColor: '#E0E0E0', stopOpacity: 1}} />
                            <stop offset="100%" style={{stopColor: '#C8C8C8', stopOpacity: 1}} />
                        </radialGradient>
                    </defs>
                    {/* Použití gradientu místo ploché barvy */}
                    <circle cx="50" cy="50" r="48" fill="url(#gradC)" stroke="#000" strokeWidth="4"></circle>
                    <text x="50" y="68" fontSize="60" textAnchor="middle" fill="#000" fontWeight="bold">{symbol}</text>
                </svg>
            </span>
        );
    }

    return null;
};

export default ManaSymbol;