
import { CardData, CardType, Rarity, Template } from './types';

// Placeholder data URI for a simple gray frame.
const modernFrame = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXcAAAKtCAIAAACVz9xeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABWSURBVHja7cExAQAAAMKg9U/tbwagAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4N2kMAAE2lADsAAAAAElFTkSuQmCC';
// Placeholder data URI for a simple purple frame.
const showcaseFrame = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXcAAAKtCAIAAACVz9xeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAB/SURBVHja7dJBAYAwEMDAwL9+aQ8eIIkd2bOzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4os+a+pt0+AZ+fvgEAAAAAAAAAAAAAAAAA+GU9cW89gP8d/30A+G09aAB4mAAA+GgBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAb2y4AAZ1LPAkAAAAASUVORK5CYII=';

export const AVAILABLE_FONTS = [
    { name: 'Beleren', value: 'Beleren, sans-serif' },
    { name: 'MPlantin', value: 'MPlantin, serif' },
    { name: 'Title', value: 'IM Fell English SC, serif' },
    { name: 'Rounded', value: 'M PLUS Rounded 1c, sans-serif' },
];

export const DEFAULT_TEMPLATES: Template[] = [
    {
        id: 'modern',
        name: 'Modern',
        frameImageUrl: modernFrame,
        elements: {
            title: { x: 5.5, y: 5, width: 55, height: 6 },
            manaCost: { x: 62, y: 5, width: 32, height: 6 },
            art: { x: 4.5, y: 12, width: 91, height: 46 },
            typeLine: { x: 5.5, y: 59, width: 75, height: 6 },
            setSymbol: { x: 84.5, y: 59.5, width: 10, height: 5 },
            textBox: { x: 5.5, y: 66, width: 89, height: 26 },
            ptBox: { x: 78, y: 88.5, width: 16, height: 6 },
            collectorNumber: { x: 5, y: 94, width: 40, height: 3 },
            artist: { x: 50, y: 94, width: 45, height: 3 },
        },
        fonts: {
            title: { fontFamily: 'Beleren, sans-serif', fontSize: 18, color: '#000000', textAlign: 'left', fontWeight: 'bold' },
            typeLine: { fontFamily: 'Beleren, sans-serif', fontSize: 16, color: '#000000', textAlign: 'left', fontWeight: 'bold' },
            rulesText: { fontFamily: 'MPlantin, serif', fontSize: 15, color: '#000000', textAlign: 'left', fontWeight: 'normal' },
            flavorText: { fontFamily: 'MPlantin, serif', fontSize: 14, color: '#000000', textAlign: 'left', fontStyle: 'italic', fontWeight: 'normal' },
            pt: { fontFamily: 'Beleren, sans-serif', fontSize: 19, color: '#000000', textAlign: 'center', fontWeight: 'bold' },
            collectorNumber: { fontFamily: 'MPlantin, serif', fontSize: 10, color: '#000000', textAlign: 'left', fontWeight: 'normal' },
            artist: { fontFamily: 'Beleren, sans-serif', fontSize: 10, color: '#000000', textAlign: 'right', fontWeight: 'normal' },
        }
    },
    {
        id: 'showcase',
        name: 'Showcase',
        frameImageUrl: showcaseFrame,
        elements: {
            title: { x: 5.5, y: 5, width: 55, height: 6 },
            manaCost: { x: 62, y: 5, width: 32, height: 6 },
            art: { x: 0, y: 0, width: 100, height: 65 }, // Full bleed art
            typeLine: { x: 5.5, y: 59, width: 75, height: 6 },
            setSymbol: { x: 84.5, y: 59.5, width: 10, height: 5 },
            textBox: { x: 5.5, y: 66, width: 89, height: 26 },
            ptBox: { x: 78, y: 88.5, width: 16, height: 6 },
            collectorNumber: { x: 5, y: 94, width: 40, height: 3 },
            artist: { x: 50, y: 94, width: 45, height: 3 },
        },
        fonts: {
            title: { fontFamily: 'Beleren, sans-serif', fontSize: 18, color: '#FFFFFF', textAlign: 'left', fontWeight: 'bold' },
            typeLine: { fontFamily: 'Beleren, sans-serif', fontSize: 16, color: '#FFFFFF', textAlign: 'left', fontWeight: 'bold' },
            rulesText: { fontFamily: 'MPlantin, serif', fontSize: 15, color: '#FFFFFF', textAlign: 'left', fontWeight: 'normal' },
            flavorText: { fontFamily: 'MPlantin, serif', fontSize: 14, color: '#FFFFFF', textAlign: 'left', fontStyle: 'italic', fontWeight: 'normal' },
            pt: { fontFamily: 'Beleren, sans-serif', fontSize: 19, color: '#FFFFFF', textAlign: 'center', fontWeight: 'bold' },
            collectorNumber: { fontFamily: 'MPlantin, serif', fontSize: 10, color: '#FFFFFF', textAlign: 'left', fontWeight: 'normal' },
            artist: { fontFamily: 'Beleren, sans-serif', fontSize: 10, color: '#FFFFFF', textAlign: 'right', fontWeight: 'normal' },
        }
    }
];

export const DEFAULT_CARD_DATA: CardData = {
    name: "AI Artificer",
    manaCost: "{2}{U}{U}",
    artUrl: "https://picsum.photos/seed/aiartificer/320/230",
    cardType: CardType.Creature,
    subtype: "Human Artificer",
    rulesText: "When AI Artificer enters the battlefield, you may create a 1/1 colorless Thopter artifact creature token with flying.\n{T}: Add {C}.",
    flavorText: "\"My creations are not merely tools; they are extensions of my will, given form by logic and light.\"",
    power: "2",
    toughness: "3",
    rarity: Rarity.Rare,
    artist: "Gemini Engine",
    collectorNumber: "042/250",
    templateId: 'modern',
    setSymbolUrl: 'https://svgs.scryfall.io/sets/unf.svg?1721534400',
};

export const MANA_SYMBOLS: { [key: string]: string } = {
    "W": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#f8f6d8" stroke="#000" stroke-width="4"></circle><path d="M50 15a31 31 0 00-22 52L50 95l22-28a31 31 0 00-22-52zm11 37H39v-6h22v6zm0-10H39v-6h22v6z"></path></svg>`,
    "U": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#c1d7e9" stroke="#000" stroke-width="4"></circle><path d="M50 15a31 31 0 00-14 59l1-2c6-12 11-23 11-32a18 18 0 114 0c0 9 5 20 11 32l1 2a31 31 0 00-14-59z"></path></svg>`,
    "B": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#bab1ab" stroke="#000" stroke-width="4"></circle><path d="M50 15a31 31 0 00-25 48 31 31 0 0050 0 31 31 0 00-25-48zm0 10a20 20 0 0118 10 20 20 0 00-36 0 20 20 0 0118-10z"></path></svg>`,
    "R": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#e9c2c0" stroke="#000" stroke-width="4"></circle><path d="M50 15a31 31 0 00-11 60L50 95l11-20a31 31 0 00-11-60zm-7 30a10 10 0 1120 0 20 20 0 10-20 0z"></path></svg>`,
    "G": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#c3d3c4" stroke="#000" stroke-width="4"></circle><path d="M50 15a31 31 0 00-31 31 31 31 0 0031 31 31 31 0 0031-31 31 31 0 00-31-31zm0 52a21 21 0 01-21-21 21 21 0 0121-21 21 21 0 0121 21 21 21 0 01-21 21z"></path></svg>`,
    "C": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#cccccc" stroke="#000" stroke-width="4"></circle><path d="M71 29a30 30 0 00-42 42l-5-5 5 5a30 30 0 0042-42l5 5-5-5zM50 50l15-15-15 15-15 15 15-15z"></path></svg>`,
};

export const SET_SYMBOLS: { [key: string]: { name: string, url: string } } = {
    'unf': { name: 'Unfinity', url: 'https://svgs.scryfall.io/sets/unf.svg?1721534400' },
    'mid': { name: 'Innistrad: Midnight Hunt', url: 'https://svgs.scryfall.io/sets/mid.svg?1721534400' },
    'neo': { name: 'Kamigawa: Neon Dynasty', url: 'https://svgs.scryfall.io/sets/neo.svg?1721534400' },
    'dmu': { name: 'Dominaria United', url: 'https://svgs.scryfall.io/sets/dmu.svg?1721534400' },
    'bro': { name: 'The Brothers\' War', url: 'https://svgs.scryfall.io/sets/bro.svg?1721534400' },
    'one': { name: 'Phyrexia: All Will Be One', url: 'https://svgs.scryfall.io/sets/one.svg?1721534400' },
};

export const RARITY_COLORS: { [key in Rarity]: string } = {
    [Rarity.Common]: '#000000',
    [Rarity.Uncommon]: '#C0C0C0',
    [Rarity.Rare]: '#FFD700',
    [Rarity.Mythic]: '#FF8000',
};
