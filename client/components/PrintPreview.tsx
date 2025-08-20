import React, { useState } from 'react';
import { Deck } from '../types';
import CardPreview from './CardPreview';
import { generateDeckPdf } from '../services/pdfService';

interface PrintPreviewProps {
    deck: Deck;
    onClose: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ deck, onClose }) => {
    const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);

    const handleGeneratePdf = async () => {
        if (!deck) return;
        setPdfProgress({ current: 0, total: deck.cards?.length || 0 });
        try {
            // Předáme ID kontejneru, kde jsou všechny karty již vykreslené
            await generateDeckPdf(deck, 'card-render-area', (progress) => {
                setPdfProgress(progress);
            });
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert(`Došlo k chybě při generování PDF: ${error}`);
        } finally {
            setPdfProgress(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-[100] flex flex-col p-4 sm:p-8">
            <header className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-gray-700 mb-4">
                <div>
                    <h2 className="text-2xl font-beleren text-yellow-300">Příprava pro PDF: {deck.name}</h2>
                    <p className="text-gray-400">Připraveno {deck.cards?.length || 0} karet. Klikněte na "Generovat PDF".</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleGeneratePdf}
                        disabled={!!pdfProgress}
                        className="py-2 px-6 rounded-md bg-blue-600 hover:bg-blue-700 font-bold disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        {pdfProgress ? `Generuji... (${pdfProgress.current}/${pdfProgress.total})` : 'Generovat PDF'}
                    </button>
                    <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">
                        Zavřít
                    </button>
                </div>
            </header>
            
            {/* 
              TENTO KONTEJNER JE KLÍČOVÝ:
              Je neviditelný pro uživatele (posunutý mimo obrazovku), ale pro html2canvas
              jeho obsah existuje a je plně vykreslený.
            */}
            <div id="card-render-area" style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                {(deck.cards || []).map(savedCard => (
                    <div key={savedCard.id} id={`card-preview-${savedCard.id}`}>
                        <CardPreview cardData={savedCard.card_data} template={savedCard.template_data} />
                    </div>
                ))}
            </div>

            <div className="flex-grow flex items-center justify-center text-gray-400">
                <p>Karty jsou připraveny na pozadí. Pro spuštění klikněte na tlačítko "Generovat PDF".</p>
            </div>
        </div>
    );
};

export default PrintPreview;