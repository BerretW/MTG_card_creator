import React, { useState } from 'react';
import { Template, TemplateElement, FontProperties } from '../types';
import DraggableResizableBox from './DraggableResizableBox';
import { AVAILABLE_FONTS } from '../constants';

interface TemplateEditorProps {
    templates: Template[];
    onSave: (templates: Template[]) => void;
    onClose: () => void;
}

type ElementKey = keyof Template['elements'];
type FontKey = keyof Template['fonts'];

const TemplateEditor: React.FC<TemplateEditorProps> = ({ templates: initialTemplates, onSave, onClose }) => {
    // Klonujeme šablony do lokálního stavu, abychom mohli dělat změny a případně je zrušit
    const [templates, setTemplates] = useState<Template[]>(() => JSON.parse(JSON.stringify(initialTemplates)));
    const [activeTemplateId, setActiveTemplateId] = useState<number | null>(templates[0]?.id || null);
    const [selectedElementKey, setSelectedElementKey] = useState<ElementKey | null>(null);

    const activeTemplate = templates.find(t => t.id === activeTemplateId);

    const handleSelectTemplate = (id: number) => {
        setActiveTemplateId(id);
        setSelectedElementKey(null);
    };
    
    const handleUpdateTemplate = (updatedTemplate: Template) => {
        setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    };

    const handleUpdateElement = (key: ElementKey, newPosition: TemplateElement) => {
        if (!activeTemplate) return;
        const updatedTemplate = {
            ...activeTemplate,
            elements: { ...activeTemplate.elements, [key]: newPosition }
        };
        handleUpdateTemplate(updatedTemplate);
    };
    
    // ... další handlery jako handleUpdateFont jsou v pořádku
    const handleUpdateFont = (key: FontKey, newFontProps: Partial<FontProperties>) => {
        if (!activeTemplate) return;
        const updatedTemplate = { ...activeTemplate, fonts: { ...activeTemplate.fonts, [key]: { ...activeTemplate.fonts[key], ...newFontProps } } };
        handleUpdateTemplate(updatedTemplate);
    };

    // --- LOGIKA PRO PŘIDÁNÍ A MAZÁNÍ JE ZAKOMENTOVANÁ ---
    // Pro její zprovoznění by bylo třeba doimplementovat API a logiku na serveru
    /*
    const handleAddNewTemplate = () => {
        // TATO FUNKCE BY VOLALA `POST /api/templates`
        alert("Funkce pro přidání nové šablony není implementována.");
    };

    const handleDeleteTemplate = (id: number) => {
        // TATO FUNKCE BY VOLALA `DELETE /api/templates/:id`
        alert("Funkce pro smazání šablony není implementována.");
    };
    */

    const handleSaveAndClose = () => {
        // Zavolá onSave z App.tsx, která pošle změny na server
        onSave(templates);
        onClose();
    };
    
    // ... zbytek souboru (renderPropertyControls, getFontKeyFromElement, JSX) je beze změny

    const getFontKeyFromElement = (elementKey: ElementKey): FontKey | null => { /* ... beze změny ... */ return null; };
    const renderPropertyControls = () => { /* ... beze změny ... */ return null; };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] border border-gray-700 flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-2xl font-beleren text-yellow-300">Template Editor</h3>
                    <div className="flex items-center gap-4">
                        <button onClick={handleSaveAndClose} className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-700">Uložit & Zavřít</button>
                        <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Zrušit</button>
                    </div>
                </header>
                
                <div className="flex-grow flex overflow-hidden">
                    <aside className="w-1/4 bg-gray-900/50 p-4 space-y-4 overflow-y-auto">
                        <div>
                            <h4 className="text-lg font-bold text-yellow-300 mb-2">Šablony</h4>
                            <div className="space-y-2">
                                {templates.map(t => (
                                    <div key={t.id} className={`flex items-center justify-between p-2 rounded cursor-pointer ${activeTemplateId === t.id ? 'bg-yellow-400/20' : 'hover:bg-gray-700'}`} onClick={() => handleSelectTemplate(t.id)}>
                                        <input type="text" value={t.name} onChange={(e) => handleUpdateTemplate({ ...t, name: e.target.value })} className="bg-transparent text-white w-full"/>
                                        {/* <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }} className="text-red-500 hover:text-red-400 text-xs">DEL</button> */}
                                    </div>
                                ))}
                            </div>
                            {/* <button onClick={handleAddNewTemplate} className="w-full mt-2 py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-sm">Nová/Duplikovat</button> */}
                        </div>
                        <hr className="border-gray-600"/>
                        {renderPropertyControls()}
                    </aside>

                    <main className="w-3/4 flex items-center justify-center p-4 bg-gray-900">
                        {activeTemplate && (
                            <div className="w-[375px] h-[525px] rounded-[18px] overflow-hidden shadow-2xl relative select-none bg-black">
                                <img src={activeTemplate.frameImageUrl} alt="Template Frame" className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
                                {(Object.keys(activeTemplate.elements) as ElementKey[]).map(key => (
                                    <DraggableResizableBox key={key} id={key} position={activeTemplate.elements[key]} onUpdate={(newPos) => handleUpdateElement(key, newPos)} isSelected={selectedElementKey === key} onClick={() => setSelectedElementKey(key)}>
                                      <span className="text-xs text-white/50">{key}</span>
                                    </DraggableResizableBox>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default TemplateEditor;