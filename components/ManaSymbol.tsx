
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
            <div
                className={className}
                dangerouslySetInnerHTML={{ __html: MANA_SYMBOLS[upperSymbol] }}
            />
        );
    }
    
    // Fallback for numeric costs or other symbols
    if (!isNaN(Number(symbol))) {
        return (
            <div className={`${className} flex items-center justify-center`}>
                <svg viewBox="0 0 100 100" className="h-full w-full">
                    <circle cx="50" cy="50" r="48" fill="#cccccc" stroke="#000" strokeWidth="4"></circle>
                    <text x="50" y="68" fontSize="60" textAnchor="middle" fill="#000" fontWeight="bold">{symbol}</text>
                </svg>
            </div>
        );
    }

    return null; // Don't render if symbol is not recognized
};

export default ManaSymbol;
