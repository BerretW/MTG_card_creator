import React from 'react';
import { CardData, CardType, Rarity, Template } from '../types';
import ManaSymbol from './ManaSymbol';
import { RARITY_COLORS } from '../constants';

interface CardPreviewProps {
    cardData: CardData;
    template: Template;
    scale?: number; // << NOVÁ PROPRIETA (např. 0.6 pro 60% velikost)
}

const parseTextWithSymbols = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((part, index) => {
        if (part.startsWith('{') && part.endsWith('}')) {
            const symbol = part.replace(/[{}]/g, '');
            // Velikost symbolu v textu bude také škálována
            const symbolSize = 16 * (index === 0 ? 1 : (part.match(/T/) ? 20 : 1)); // Placeholder pro tap symbol
            return <ManaSymbol key={`${symbol}-${index}`} symbol={symbol} className="inline-block align-text-bottom mx-px" style={{ height: `${symbolSize}px`, width: `${symbolSize}px`}}/>;
        }
        return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
    });
};

const generateMaskedGradientStyle = (template: Template): React.CSSProperties => {
    if (!template.gradientStartColor || !template.gradientEndColor || !template.frameImageUrl) {
        return {};
    }
    const angle = template.gradientAngle ?? 180;
    const opacity = template.gradientOpacity ?? 0.5;
    const start = template.gradientStartColor;
    const end = template.gradientEndColor;

    return {
        background: `linear-gradient(${angle}deg, ${start}, ${end})`,
        opacity: opacity,
        maskImage: `url("${template.frameImageUrl}")`,
        maskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        maskMode: 'alpha',
        WebkitMaskImage: `url("${template.frameImageUrl}")`,
        WebkitMaskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
    };
};


const CardPreview: React.FC<CardPreviewProps> = ({ cardData, template, scale = 1 }) => {
    if (!template) {
        return <div className="w-[375px] h-[525px] bg-red-500 text-white flex items-center justify-center">Šablona nebyla nalezena!</div>;
    }

    const {
        name, manaCost, art, cardType, subtype,
        rulesText, flavorText, power, toughness,
        rarity, artist, collectorNumber, setSymbolUrl
    } = cardData;
    
    const { elements, fonts, frameImageUrl, saturation, hue } = template;
    const isCreature = cardType === CardType.Creature;
    const rarityColor = RARITY_COLORS[rarity];
    const parsedCost = manaCost.replace(/\{/g, ' ').replace(/\}/g, ' ').trim().split(/\s+/);

    const getElementStyle = (el: keyof Template['elements'], zIndex: number = 3): React.CSSProperties => ({
        position: 'absolute',
        left: `${elements[el].x}%`,
        top: `${elements[el].y}%`,
        width: `${elements[el].width}%`,
        height: `${elements[el].height}%`,
        display: 'flex',
        alignItems: 'center',
        zIndex,
    });

    const getFontStyle = (font: keyof Template['fonts']): React.CSSProperties => ({
        fontFamily: fonts[font].fontFamily,
        fontSize: `${fonts[font].fontSize * scale}px`,
        color: fonts[font].color,
        textAlign: fonts[font].textAlign,
        fontStyle: fonts[font].fontStyle || 'normal',
        fontWeight: fonts[font].fontWeight || 'normal',
        width: '100%',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.2, // Ponecháme relativní, aby se správně škáloval s font-size
    });

    return (
        <div 
            className="overflow-hidden shadow-2xl relative select-none bg-black"
            style={{
                width: `${375 * scale}px`,
                height: `${525 * scale}px`,
                borderRadius: `${18 * scale}px`,
            }}
        >
            <div style={{...getElementStyle('art', 0), overflow: 'hidden'}}>
                <img src={art.cropped} alt="Card Art" className="w-full h-full object-cover" />
            </div>

            <img 
                src={frameImageUrl} 
                alt="Card Frame" 
                className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                style={{ 
                    zIndex: 1,
                    filter: `saturate(${saturation ?? 1}) hue-rotate(${hue ?? 0}deg)`
                }}
            />
            
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    ...generateMaskedGradientStyle(template),
                    zIndex: 2
                }}
            />

            <div style={getElementStyle('title')}>
                <p style={getFontStyle('title')}>{name}</p>
            </div>
            
            <div style={{...getElementStyle('manaCost'), justifyContent: 'flex-end', gap: `${2 * scale}px`}}>
                {parsedCost.map((symbol, index) => symbol && <ManaSymbol key={index} symbol={symbol} className={`inline-block`} style={{ height: `${24 * scale}px`, width: `${24 * scale}px`}} />)}
            </div>

            <div style={getElementStyle('typeLine')}>
                <p style={getFontStyle('typeLine')}>{cardType}{subtype && ` — ${subtype}`}</p>
            </div>

            <div style={{ ...getElementStyle('setSymbol'), justifyContent: 'center' }}>
                <img src={setSymbolUrl} alt="Set Symbol" className="h-full w-auto" style={{ filter: `drop-shadow(0 0 2px ${rarityColor})` }}/>
            </div>

            <div style={{ ...getElementStyle('textBox'), display: 'block', overflowY: 'auto', padding: `${5 * scale}px` }}>
                <div style={getFontStyle('rulesText')}>
                    {rulesText.split('\n').map((line, i) => (
                        <div key={i}>{parseTextWithSymbols(line)}</div>
                    ))}
                </div>
                 {flavorText && (
                    <div style={{...getFontStyle('flavorText'), paddingTop: `${8 * scale}px` }}>
                       {flavorText.split('\n').map((line, i) => (
                           <div key={i}>{line}</div>
                        ))}
                    </div>
                )}
            </div>

            {isCreature && (
                <div style={{...getElementStyle('ptBox'), justifyContent: 'center' }}>
                    <span style={getFontStyle('pt')}>{power} / {toughness}</span>
                </div>
            )}

            <div style={getElementStyle('collectorNumber')}>
                 <span style={getFontStyle('collectorNumber')}>{collectorNumber}</span>
            </div>

            <div style={getElementStyle('artist')}>
                 <span style={getFontStyle('artist')}>Illus. {artist}</span>
            </div>
        </div>
    );
};

export default CardPreview;