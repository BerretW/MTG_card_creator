import React, { useState, useRef } from 'react';
import { Template, TemplateElement, FontProperties } from '../types';
import DraggableResizableBox from './DraggableResizableBox';
import { AVAILABLE_FONTS, DEFAULT_TEMPLATES } from '../constants';

interface TemplateEditorProps {
    templates: Template[];
    onSave: (templates: Template[]) => void;
    onClose: () => void;
}

type ElementKey = keyof Template['elements'];
type FontKey = keyof Template['fonts'];

const TemplateEditor: React.FC<TemplateEditorProps> = ({ templates: initialTemplates, onSave, onClose }) => {
    const [templates, setTemplates] = useState<Template[]>(() => JSON.parse(JSON.stringify(initialTemplates)));
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>(templates[0]?.id || null);
    const [selectedElementKey, setSelectedElementKey] = useState<ElementKey | null>(null);

    // OPRAVA: Hook `useRef` je přesunut na nejvyšší úroveň komponenty.
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeTemplate = templates.find(t => t.id === activeTemplateId);

    const handleSelectTemplate = (id: string) => {
        setActiveTemplateId(id);
        setSelectedElementKey(null);
    };
    
    const handleUpdateTemplate = (updatedTemplate: Template) => {
        setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    };

    const handleUpdateElement = (key: ElementKey, newPosition: TemplateElement) => {
        if (!activeTemplate) return;
        const updatedTemplate = { ...activeTemplate, elements: { ...activeTemplate.elements, [key]: newPosition } };
        handleUpdateTemplate(updatedTemplate);
    };
    
    const handleUpdateFont = (key: FontKey, newFontProps: Partial<FontProperties>) => {
        if (!activeTemplate) return;
        const updatedTemplate = { ...activeTemplate, fonts: { ...activeTemplate.fonts, [key]: { ...activeTemplate.fonts[key], ...newFontProps } } };
        handleUpdateTemplate(updatedTemplate);
    };

    const handleDuplicateTemplate = (idToDuplicate: string) => {
        const templateToDuplicate = templates.find(t => t.id === idToDuplicate);
        if (!templateToDuplicate) return;
        const newTemplate = {
            ...JSON.parse(JSON.stringify(templateToDuplicate)),
            id: `new-${Date.now()}`,
            name: `${templateToDuplicate.name} (Kopie)`,
        };
        setTemplates(prev => [...prev, newTemplate]);
        setActiveTemplateId(newTemplate.id);
    };
    
    const handleAddNewTemplate = () => {
        const baseTemplate = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES[0])); 
        const newTemplate = {
            ...baseTemplate,
            id: `new-${Date.now()}`,
            name: 'Nová šablona',
        };
        setTemplates(prev => [...prev, newTemplate]);
        setActiveTemplateId(newTemplate.id);
    };
    
     const handleFrameImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeTemplate) return;
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const updatedTemplate = { ...activeTemplate, frameImageUrl: event.target?.result as string };
                handleUpdateTemplate(updatedTemplate);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAndClose = () => {
        onSave(templates);
        onClose();
    };
    
    const getFontKeyFromElement = (elementKey: ElementKey): FontKey | null => {
        switch (elementKey) {
            case 'title': return 'title';
            case 'typeLine': return 'typeLine';
            case 'textBox': return 'rulesText';
            case 'ptBox': return 'pt';
            case 'artist': return 'artist';
            case 'collectorNumber': return 'collectorNumber';
            default: return null;
        }
    };

    const renderPropertyControls = () => {
        if (!activeTemplate) return <p className="text-gray-400 text-sm">Vyberte šablonu pro úpravy.</p>;

        if (!selectedElementKey) {
            return (
                 <div>
                    <h4 className="text-lg font-bold text-yellow-300 mb-2">Vlastnosti šablony</h4>
                    <div className="space-y-4 text-sm">
                        <div>
                           <label className="font-bold text-gray-400">Název šablony</label>
                           <input type="text" value={activeTemplate.name} onChange={(e) => handleUpdateTemplate({ ...activeTemplate, name: e.target.value })} className="w-full bg-gray-700 p-2 rounded border border-gray-600 mt-1" />
                        </div>
                        <div>
                             <label className="font-bold text-gray-400">Obrázek rámečku</label>
                             <img src={activeTemplate.frameImageUrl} alt="Frame Preview" className="w-full rounded border border-gray-600 my-2 aspect-[375/525] object-contain bg-black" />
                             <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} className="hidden" onChange={handleFrameImageUpload} />
                             <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-sm transition-colors">Změnit obrázek</button>
                        </div>
                    </div>
                </div>
            );
        }

        const element = activeTemplate.elements[selectedElementKey];
        const fontKey = getFontKeyFromElement(selectedElementKey);
        const font = fontKey ? activeTemplate.fonts[fontKey] : null;

        const handleElementChange = (prop: keyof TemplateElement, value: string) => {
            const numericValue = parseFloat(value) || 0;
            handleUpdateElement(selectedElementKey, { ...element, [prop]: numericValue });
        };
        const handleFontChange = (prop: keyof FontProperties, value: any) => {
            if (!fontKey) return;
            const finalValue = prop === 'fontSize' ? parseInt(value, 10) : value;
            handleUpdateFont(fontKey, { [prop]: finalValue });
        };

        return (
            <div>
                <h4 className="text-lg font-bold text-yellow-300 mb-2 capitalize">{selectedElementKey.replace(/([A-Z])/g, ' $1')}</h4>
                <div className="space-y-2 text-sm">
                    <button onClick={() => setSelectedElementKey(null)} className="text-yellow-400 hover:underline text-xs mb-2">
                        &larr; Zpět na vlastnosti šablony
                    </button>
                    <p className="font-bold text-gray-400 mt-2">Position & Size (%)</p>
                    <div className="grid grid-cols-2 gap-2">
                        <label>X: <input type="number" step="0.1" value={element.x.toFixed(1)} onChange={e => handleElementChange('x', e.target.value)} className="w-full bg-gray-700 p-1 rounded border border-gray-600" /></label>
                        <label>Y: <input type="number" step="0.1" value={element.y.toFixed(1)} onChange={e => handleElementChange('y', e.target.value)} className="w-full bg-gray-700 p-1 rounded border border-gray-600" /></label>
                        <label>W: <input type="number" step="0.1" value={element.width.toFixed(1)} onChange={e => handleElementChange('width', e.target.value)} className="w-full bg-gray-700 p-1 rounded border border-gray-600" /></label>
                        <label>H: <input type="number" step="0.1" value={element.height.toFixed(1)} onChange={e => handleElementChange('height', e.target.value)} className="w-full bg-gray-700 p-1 rounded border border-gray-600" /></label>
                    </div>

                    {font && fontKey && (
                        <>
                            <p className="font-bold text-gray-400 mt-4">Font</p>
                            <label>Family:
                                <select value={font.fontFamily} onChange={e => handleFontChange('fontFamily', e.target.value)} className="w-full bg-gray-700 p-1 rounded border border-gray-600">
                                    {AVAILABLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                </select>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <label>Size (px): <input type="number" value={font.fontSize} onChange={e => handleFontChange('fontSize', e.target.value)} className="w-full bg-gray-700 p-1 rounded border border-gray-600" /></label>
                              <label>Color: <input type="color" value={font.color} onChange={e => handleFontChange('color', e.target.value)} className="w-full bg-gray-700 p-0 h-8 border-gray-600 cursor-pointer" /></label>
                            </div>
                             <div className="grid grid-cols-2 gap-2">
                               <label>Align:
                                    <select value={font.textAlign} onChange={e => handleFontChange('textAlign', e.target.value as 'left' | 'center' | 'right')} className="w-full bg-gray-700 p-1 rounded border border-gray-600">
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                    </select>
                                </label>
                                <label>Weight:
                                    <select value={font.fontWeight || 'normal'} onChange={e => handleFontChange('fontWeight', e.target.value as 'normal' | 'bold')} className="w-full bg-gray-700 p-1 rounded border border-gray-600">
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                    </select>
                                </label>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

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
                                        <span className="flex-grow truncate pr-2">{t.name}</span>
                                        <button title="Duplikovat šablonu" onClick={(e) => { e.stopPropagation(); handleDuplicateTemplate(t.id); }} className="text-gray-400 hover:text-white p-1 flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddNewTemplate} className="w-full mt-4 py-2 px-4 rounded-md bg-blue-700 hover:bg-blue-600 text-sm transition-colors">
                                + Přidat novou šablonu
                            </button>
                        </div>
                        <hr className="border-gray-600"/>
                        {renderPropertyControls()}
                    </aside>

                    <main className="w-3/4 flex items-center justify-center p-4 bg-gray-900">
                         {activeTemplate ? (
                            <div className="w-[375px] h-[525px] rounded-[18px] overflow-hidden shadow-2xl relative select-none bg-black" onClick={() => setSelectedElementKey(null)}>
                                <img src={activeTemplate.frameImageUrl} alt="Template Frame" className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
                                {(Object.keys(activeTemplate.elements) as ElementKey[]).map(key => (
                                    <DraggableResizableBox 
                                        key={key} 
                                        id={key} 
                                        position={activeTemplate.elements[key]} 
                                        onUpdate={(newPos) => handleUpdateElement(key, newPos)} 
                                        isSelected={selectedElementKey === key} 
                                        onClick={(e) => { e.stopPropagation(); setSelectedElementKey(key); }}>
                                      <span className="text-xs text-white/50 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    </DraggableResizableBox>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-400">Žádná šablona k zobrazení. Vytvořte novou.</div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default TemplateEditor;