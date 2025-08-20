import jsPDF from 'jspdf';
import { Deck } from '../types';

// Konstanty zůstávají stejné
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const CARD_WIDTH_MM = 63;
const CARD_HEIGHT_MM = 88;
const GUTTER_MM = 4;
const CROP_MARK_LENGTH_MM = 5;
const CARDS_PER_PAGE = 8; // 2x4 layout

/**
 * Generuje PDF soubor pro tisk z pole předem připravených obrázků karet.
 * @param deck Objekt balíčku (pro název souboru).
 * @param cardImageUrls Pole base64 datových URL obrázků karet.
 * @param onProgress Callback pro sledování postupu.
 */
export const generateDeckPdf = async (
    deck: Deck,
    cardImageUrls: string[],
    onProgress: (progress: { current: number; total: number }) => void
): Promise<void> => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const totalCards = cardImageUrls.length;

    const cols = 2;
    const rows = 4;
    const gridWidth = cols * CARD_WIDTH_MM + (cols - 1) * GUTTER_MM;
    const gridHeight = rows * CARD_HEIGHT_MM + (rows - 1) * GUTTER_MM;
    const marginX = (A4_WIDTH_MM - gridWidth) / 2;
    const marginY = (A4_HEIGHT_MM - gridHeight) / 2;

    for (let i = 0; i < totalCards; i++) {
        const cardIndexOnPage = i % CARDS_PER_PAGE;
        const page = Math.floor(i / CARDS_PER_PAGE);

        if (cardIndexOnPage === 0 && page > 0) {
            doc.addPage();
        }

        onProgress({ current: i + 1, total: totalCards });
        const imageData = cardImageUrls[i];
        
        const col = cardIndexOnPage % cols;
        const row = Math.floor(cardIndexOnPage / cols);
        const x = marginX + col * (CARD_WIDTH_MM + GUTTER_MM);
        const y = marginY + row * (CARD_HEIGHT_MM + GUTTER_MM);

        doc.addImage(imageData, 'PNG', x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);
        drawCropMarks(doc, x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);
    }
    
    doc.save(`${deck.name.replace(/\s+/g, '_')}.pdf`);
};

// Funkce pro kreslení značek zůstává stejná
const drawCropMarks = (doc: jsPDF, x: number, y: number, width: number, height: number) => {
    doc.setLineWidth(0.1);
    doc.setDrawColor(0);
    const offset = CROP_MARK_LENGTH_MM;

    doc.line(x - offset, y, x, y);
    doc.line(x, y - offset, x, y);
    doc.line(x + width, y, x + width + offset, y);
    doc.line(x + width, y - offset, x + width, y);
    doc.line(x - offset, y + height, x, y + height);
    doc.line(x, y + height, x, y + height + offset);
    doc.line(x + width, y + height, x + width + offset, y + height);
    doc.line(x + width, y + height, x + width, y + height + offset);
};