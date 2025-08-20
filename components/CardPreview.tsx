
import React from 'react';
import { CardData, CardType, Rarity, Template } from '../types';
import ManaSymbol from './ManaSymbol';
import { RARITY_COLORS } from '../constants';

interface CardPreviewProps {
    cardData: CardData;
    template: Template;
}

const parseTextWithSymbols = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((part, index) => {
        const symbol = part.replace(/[{}]/g, '');
        if (part.startsWith('{') && part.endsWith('}')) {
            return <ManaSymbol key={index} symbol={symbol} className="h-4 w-4 inline-block align-text-bottom mx-px" />;
        }
        return <span key={index}>{part}</span>;
    });
};

const CardPreview: React.FC<CardPreviewProps> = ({ cardData, template }) => {
    if (!template) {
        return <div className="w-[375px] h-[525px] bg-red-500 text-white flex items-center justify-center">Template not found!</div>;
    }

    const {
        name, manaCost, artUrl, cardType, subtype,
        rulesText, flavorText, power, toughness,
        rarity, artist, collectorNumber, setSymbolUrl
    } = cardData;
    
    const { elements, fonts, frameImageUrl } = template;
    const isCreature = cardType === CardType.Creature;
    const rarityColor = RARITY_COLORS[rarity];
    const parsedCost = manaCost.replace(/\{/g, ' ').replace(/\}/g, ' ').trim().split(/\s+/);

    const getElementStyle = (el: keyof Template['elements']): React.CSSProperties => ({
        position: 'absolute',
        left: `${elements[el].x}%`,
        top: `${elements[el].y}%`,
        width: `${elements[el].width}%`,
        height: `${elements[el].height}%`,
        display: 'flex',
        alignItems: 'center',
    });

    const getFontStyle = (font: keyof Template['fonts']): React.CSSProperties => ({
        fontFamily: fonts[font].fontFamily,
        fontSize: `${fonts[font].fontSize}px`,
        color: fonts[font].color,
        textAlign: fonts[font].textAlign,
        fontStyle: fonts[font].fontStyle || 'normal',
        fontWeight: fonts[font].fontWeight || 'normal',
        width: '100%',
        whiteSpace: 'pre-wrap',
        lineHeight: '1.2',
    });

    return (
        <div 
            className="w-[375px] h-[525px] rounded-[18px] overflow-hidden shadow-2xl relative select-none bg-black bg-cover bg-center"
            style={{ backgroundImage: `url(${frameImageUrl})`}}
        >
            {/* Art Box */}
            <div style={{...getElementStyle('art'), overflow: 'hidden'}}>
                <img src={artUrl} alt="Card Art" className="w-full h-full object-cover" />
            </div>

            {/* Title */}
            <div style={getElementStyle('title')}>
                <p style={getFontStyle('title')}>{name}</p>
            </div>
            
            {/* Mana Cost */}
            <div style={{...getElementStyle('manaCost'), justifyContent: 'flex-end', gap: '2px'}}>
                {parsedCost.map((symbol, index) => symbol && <ManaSymbol key={index} symbol={symbol} className="h-6 w-6" />)}
            </div>

            {/* Type Line */}
            <div style={getElementStyle('typeLine')}>
                <p style={getFontStyle('typeLine')}>{cardType}{subtype && ` — ${subtype}`}</p>
            </div>

            {/* Set Symbol */}
            <div style={{ ...getElementStyle('setSymbol'), justifyContent: 'center' }}>
                <img src={setSymbolUrl} alt="Set Symbol" className="h-full w-auto" style={{ filter: `drop-shadow(0 0 2px ${rarityColor})` }}/>
            </div>

            {/* Text Box */}
            <div style={{ ...getElementStyle('textBox'), display: 'block', overflowY: 'auto', padding: '5px' }}>
                <div style={getFontStyle('rulesText')}>
                    {rulesText.split('\n').map((line, i) => <p key={i}>{parseTextWithSymbols(line)}</p>)}
                </div>
                 {flavorText && (
                    <div style={{...getFontStyle('flavorText'), paddingTop: '8px' }}>
                       {flavorText.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                )}
            </div>

            {/* P/T Box */}
            {isCreature && (
                <div style={{...getElementStyle('ptBox'), justifyContent: 'center' }}>
                    <span style={getFontStyle('pt')}>{power} / {toughness}</span>
                </div>
            )}

            {/* Collector Number */}
            <div style={getElementStyle('collectorNumber')}>
                 <span style={getFontStyle('collectorNumber')}>{collectorNumber}</span>
            </div>

            {/* Artist */}
            <div style={getElementStyle('artist')}>
                 <span style={getFontStyle('artist')}>Illus. {artist}</span>
            </div>
        </div>
    );
};

export default CardPreview;
