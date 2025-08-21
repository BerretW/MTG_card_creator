import React from 'react';
import { CardData, CardType, Template } from '../types';
// ZMĚNA: Odstraněn import ManaSymbol, místo toho importujeme MANA_SYMBOLS
import { RARITY_COLORS, MANA_SYMBOLS } from '../constants';

interface CardPreviewProps {
    cardData: CardData;
    template: Template;
    scale?: number;
}

const SYMBOL_OFFSETS: Record<string, number> = {
  T: -0.16,   // zvedne o 0.16em
  UT: -0.08,  // zvedne o 0.08em
  // ostatní nech prázdné = 0
};

const parseTextWithSymbols = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\{[^}]+\})/g);

  return parts.map((part, index) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const symbol = part.slice(1, -1);
      const offsetEm = SYMBOL_OFFSETS[symbol] ?? 0;
      const imageUrl = MANA_SYMBOLS[symbol]; // ZMĚNA: Získání URL

      // ZMĚNA: Vykreslení <img> místo komponenty ManaSymbol
      if (imageUrl) {
        return (
          <img
            key={`${symbol}-${index}`}
            src={imageUrl}
            alt={symbol}
            className="mx-px"
            style={{
              display: 'inline-block',
              height: '1em',
              width: '1em',
              verticalAlign: 'middle',
              transform: `translateY(${offsetEm}em)`,
            }}
          />
        );
      }
      // Fallback pro symbol, který nemáme v mapě
      return <React.Fragment key={`text-fallback-${index}`}>{part}</React.Fragment>;
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
        lineHeight: 1.2,
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
            {(elements.art.visible ?? true) && (
                <div style={{...getElementStyle('art', 0), overflow: 'hidden'}}>
                    <img src={art.cropped} alt="Card Art" className="w-full h-full object-cover" />
                </div>
            )}

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

            {(elements.title.visible ?? true) && (
                <div style={getElementStyle('title')}>
                    <p style={getFontStyle('title')}>{name}</p>
                </div>
            )}
            
            {(elements.manaCost.visible ?? true) && (
                <div style={{...getElementStyle('manaCost'), justifyContent: 'flex-end', gap: `${2 * scale}px`}}>
                    {/* ZMĚNA: Vykreslení <img> místo komponenty ManaSymbol */}
                    {parsedCost.map((symbol, index) => {
                        const imageUrl = MANA_SYMBOLS[symbol];
                        if (!imageUrl) return null;
                        
                        return (
                            <img 
                                key={index} 
                                src={imageUrl}
                                alt={symbol}
                                className="inline-block"
                                style={{ height: `${24 * scale}px`, width: `${24 * scale}px` }} 
                            />
                        );
                    })}
                </div>
            )}

            {(elements.typeLine.visible ?? true) && (
                <div style={getElementStyle('typeLine')}>
                    <p style={getFontStyle('typeLine')}>{cardType}{subtype && ` — ${subtype}`}</p>
                </div>
            )}

            {(elements.setSymbol.visible ?? true) && (
                <div style={{ ...getElementStyle('setSymbol'), justifyContent: 'center' }}>
                    <img src={setSymbolUrl} alt="Set Symbol" className="h-full w-auto" style={{ filter: `drop-shadow(0 0 2px ${rarityColor})` }}/>
                </div>
            )}

            {(elements.textBox.visible ?? true) && (
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
            )}

            {isCreature && (elements.ptBox.visible ?? true) && (
                <div style={{...getElementStyle('ptBox'), justifyContent: 'center' }}>
                    <span style={getFontStyle('pt')}>{power} / {toughness}</span>
                </div>
            )}

            {(elements.collectorNumber.visible ?? true) && (
                <div style={getElementStyle('collectorNumber')}>
                     <span style={getFontStyle('collectorNumber')}>{collectorNumber}</span>
                </div>
            )}

            {(elements.artist.visible ?? true) && (
                <div style={getElementStyle('artist')}>
                     <span style={getFontStyle('artist')}>Illus. {artist}</span>
                </div>
            )}
        </div>
    );
};

export default CardPreview;