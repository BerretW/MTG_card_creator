import React from 'react';
import { CardData, CardType, Template, TemplateElement } from '../types';
import { RARITY_COLORS, MANA_SYMBOLS } from '../constants';

interface CardPreviewProps {
    cardData: CardData;
    template: Template;
    scale?: number;
}

const SYMBOL_OFFSETS: Record<string, number> = {
  T: -0.16,
  UT: -0.08,
};

const parseTextWithSymbols = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\{[^}]+\})/g);

  return parts.map((part, index) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const symbol = part.slice(1, -1);
      const offsetEm = SYMBOL_OFFSETS[symbol] ?? 0;
      const imageUrl = MANA_SYMBOLS[symbol];

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
        rarity, artist, collectorNumber, setSymbolUrl,
        customFields
    } = cardData;
    
    const { elements, fonts, frameImageUrl, saturation, hue } = template;
    const { customElements } = elements;
    const isCreature = cardType === CardType.Creature;
    const rarityColor = RARITY_COLORS[rarity];
    const parsedCost = manaCost.replace(/\{/g, ' ').replace(/\}/g, ' ').trim().split(/\s+/);

    const getElementContainerStyle = (element: TemplateElement): React.CSSProperties => ({
        position: 'absolute',
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        transform: `rotate(${element.rotation ?? 0}deg)`,
        display: 'flex',
    });

    const getFontStyle = (fontKey: string): React.CSSProperties => {
        const font = fonts[fontKey];
        if (!font) return {};
        return {
            fontFamily: font.fontFamily,
            fontSize: `${font.fontSize * scale}px`,
            color: font.color,
            textAlign: font.textAlign,
            fontStyle: font.fontStyle || 'normal',
            fontWeight: font.fontWeight || 'normal',
            lineHeight: 1.2,
            whiteSpace: 'pre-wrap',
            // --- ZMĚNA ZDE: Odstraněna šířka, je řízena kontejnerem ---
        };
    };

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
                <div style={{...getElementContainerStyle(elements.art), zIndex: 0, overflow: 'hidden'}}>
                    <img src={art.cropped} alt="Card Art" className="w-full h-full object-cover" />
                </div>
            )}

            <img 
                src={frameImageUrl} 
                alt="Card Frame" 
                className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                style={{ zIndex: 1, filter: `saturate(${saturation ?? 1}) hue-rotate(${hue ?? 0}deg)` }}
            />
            
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{ ...generateMaskedGradientStyle(template), zIndex: 2 }}
            />

            {(elements.title.visible ?? true) && (
                <div style={{...getElementContainerStyle(elements.title), zIndex: 3, alignItems: 'center'}}>
                    <div style={{...getFontStyle('title'), width: '100%'}}>{name}</div>
                </div>
            )}
            
            {(elements.manaCost.visible ?? true) && (
                <div style={{...getElementContainerStyle(elements.manaCost), justifyContent: 'flex-end', gap: `${2 * scale}px`, zIndex: 3, alignItems: 'center'}}>
                    {parsedCost.map((symbol, index) => (
                        <img key={index} src={MANA_SYMBOLS[symbol]} alt={symbol} className="inline-block" style={{ height: `${24 * scale}px`, width: `${24 * scale}px` }} />
                    ))}
                </div>
            )}

            {(elements.typeLine.visible ?? true) && (
                <div style={{...getElementContainerStyle(elements.typeLine), zIndex: 3, alignItems: 'center'}}>
                    <div style={{...getFontStyle('typeLine'), width: '100%'}}>{cardType}{subtype && ` — ${subtype}`}</div>
                </div>
            )}

            {(elements.setSymbol.visible ?? true) && (
                <div style={{ ...getElementContainerStyle(elements.setSymbol), justifyContent: 'center', zIndex: 3, alignItems: 'center' }}>
                    <img src={setSymbolUrl} alt="Set Symbol" className="h-full w-auto" style={{ filter: `drop-shadow(0 0 2px ${rarityColor})` }}/>
                </div>
            )}

            {(elements.textBox.visible ?? true) && (
                <div style={{ ...getElementContainerStyle(elements.textBox), display: 'block', overflowY: 'auto', padding: `${5 * scale}px`, zIndex: 3 }}>
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
                <div style={{...getElementContainerStyle(elements.ptBox), justifyContent: 'center', zIndex: 3, alignItems: 'center' }}>
                    <div style={{...getFontStyle('pt'), width: '100%'}}>{power} / {toughness}</div>
                </div>
            )}

            {(elements.collectorNumber.visible ?? true) && (
                <div style={{...getElementContainerStyle(elements.collectorNumber), zIndex: 3, alignItems: 'center'}}>
                     <div style={{...getFontStyle('collectorNumber'), width: '100%'}}>{collectorNumber}</div>
                </div>
            )}

            {(elements.artist.visible ?? true) && (
                <div style={{...getElementContainerStyle(elements.artist), zIndex: 3, alignItems: 'center'}}>
                     <div style={{...getFontStyle('artist'), width: '100%'}}>Illus. {artist}</div>
                </div>
            )}

            {(customElements || []).map(customEl => {
                const value = customFields?.[customEl.key];
                if (!value || !(customEl.position.visible ?? true)) return null;

                const content = customEl.parsesSymbols ? parseTextWithSymbols(value) : value;
                const fontStyle = getFontStyle(customEl.fontKey);
                
                const elementContainerStyle: React.CSSProperties = {
                    ...getElementContainerStyle(customEl.position), 
                    zIndex: 3,
                    padding: `0 ${4 * scale}px`,
                    alignItems: 'center',
                    justifyContent: fontStyle.textAlign || 'center',
                };

                return (
                    <div key={customEl.key} style={elementContainerStyle}>
                        <div style={{...fontStyle, width: 'auto', display: 'flex', alignItems: 'center', gap: '0.1em' }}>
                            {content}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CardPreview;