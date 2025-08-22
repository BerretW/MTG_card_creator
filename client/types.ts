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
    
    rarity: Rarity;
    artist: string;
    collectorNumber: string;
    templateId: string;
    setSymbolUrl: string;
    customFields: Record<string, string>; 
}


export interface CustomTemplateElement {
    key: string; // Unikátní klíč (např. "loyalty", "chargeCounters")
    label: string; // Zobrazovaný název (např. "Loyalty", "Počet žetonů")
    position: TemplateElement;
    fontKey: string; // Klíč pro nalezení stylu v `template.fonts`
     parsesSymbols?: boolean; // <<--- NOVÁ VOLITELNÁ VLASTNOST
}


export interface TemplateElement {
    x: number; // %
    y: number; // %
    width: number; // %
    height: number; // %
    visible?: boolean; // << ZMĚNA ZDE: Přidána volitelná vlastnost pro viditelnost
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
    user_id: number; // ID autora šablony
    authorUsername?: string; // Jméno autora (nepovinné, kdyby byl uživatel smazán)
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
        // Přidáme volitelné pole pro custom elementy přímo sem
        customElements?: CustomTemplateElement[];
    };
fonts: Record<string, FontProperties>; 
    // --- ROZŠÍŘENÉ VLASTNOSTI ---
    saturation?: number;
    hue?: number; // Nová vlastnost pro odstín
    gradientAngle?: number;
    gradientOpacity?: number;
    gradientStartColor?: string;
    gradientEndColor?: string;
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

export interface SavedCard {
    id: number;
    deck_id: number;
    card_data: CardData;
    template_data: Template;
}

export interface Deck {
    id: number;
    user_id: number;
    name: string;
    description: string;
    created_at: string;
    cards?: SavedCard[]; // Karty jsou načítány volitelně
}