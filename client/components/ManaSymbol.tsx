import React from 'react';
import { MANA_SYMBOLS } from '../constants';

interface ManaSymbolProps {
    symbol: string;
    className?: string;
    style?: React.CSSProperties;
}

const ManaSymbol: React.FC<ManaSymbolProps> = ({ symbol, className = '', style }) => {
    const upperSymbol = symbol.toUpperCase();
    
    if (MANA_SYMBOLS[upperSymbol]) {
        return (
            <span
                className={className}
                style={style}
                dangerouslySetInnerHTML={{ __html: MANA_SYMBOLS[upperSymbol] }}
            />
        );
    }
    
    if (!isNaN(Number(symbol))) {
        return (
            <span className={`${className} inline-flex items-center justify-center`} style={style}>
                <svg viewBox="0 0 100 100" className="h-full w-full">
                    <defs>
                        <radialGradient id="gradC" cx="50%" cy="40%" r="50%" fx="50%" fy="40%">
                            <stop offset="0%" style={{stopColor: '#E0E0E0', stopOpacity: 1}} />
                            <stop offset="100%" style={{stopColor: '#C8C8C8', stopOpacity: 1}} />
                        </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="48" fill="url(#gradC)" stroke="#000" strokeWidth="4"></circle>
                    <text x="50" y="68" fontSize="60" textAnchor="middle" fill="#000" fontWeight="bold">{symbol}</text>
                </svg>
            </span>
        );
    }

    return null;
};

export default ManaSymbol;