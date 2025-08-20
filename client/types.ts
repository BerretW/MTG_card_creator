
export enum CardType {
    Creature = "Creature",
    Instant = "Instant",
    Sorcery = "Sorcery",
    Artifact = "Artifact",
    Enchantment = "Enchantment",
    Land = "Land",
    Planeswalker = "Planeswalker",
}

export enum Rarity {
    Common = "Common",
    Uncommon = "Uncommon",
    Rare = "Rare",
    Mythic = "Mythic",
}


export interface CardArt {
    original: string; // URL na původní, ne-oříznutý obrázek
    cropped: string;  // URL na oříznutou verzi pro zobrazení
}


export interface CardData {
    name: string;
    manaCost: string;
    art: CardArt;
    cardType: CardType;
    subtype: string;
    rulesText: string;
    flavorText: string;
    power: string;
    toughness: string;
    loyalty?: string;
    rarity: Rarity;
    artist: string;
    collectorNumber: string;
    templateId: string;
    setSymbolUrl: string;
}

export interface TemplateElement {
    x: number; // %
    y: number; // %
    width: number; // %
    height: number; // %
}

export interface FontProperties {
    fontFamily: string;
    fontSize: number; // px, relative to a 375px card width
    color: string;
    textAlign: 'left' | 'center' | 'right';
    fontStyle?: 'normal' | 'italic';
    fontWeight?: 'normal' | 'bold';
}

export interface Template {
    id: string;
    name: string;
    frameImageUrl: string;
    elements: {
        title: TemplateElement;
        manaCost: TemplateElement;
        art: TemplateElement;
        typeLine: TemplateElement;
        setSymbol: TemplateElement;
        textBox: TemplateElement;
        ptBox: TemplateElement;
        artist: TemplateElement;
        collectorNumber: TemplateElement;
    };
    fonts: {
        title: FontProperties;
        typeLine: FontProperties;
        rulesText: FontProperties;
        flavorText: FontProperties;
        pt: FontProperties;
        artist: FontProperties;
        collectorNumber: FontProperties;
    };
}

export interface ArtAsset {
    id: number;
    dataUrl: string;
}

export interface CustomSetSymbol {
    id: string;
    name: string;
    url: string;
}
