import React, { useState, useRef, useEffect } from 'react';
import { Template, TemplateElement, FontProperties } from '../types';
import DraggableResizableBox from './DraggableResizableBox';
import { AVAILABLE_FONTS, DEFAULT_TEMPLATES } from '../constants';
import { useAppStore } from '../store/appStore';

interface TemplateEditorProps {
    templates: Template[];
    onSave: (templates: Template[]) => void;
    onClose: () => void;
    currentUserId: number | null;
    onDelete: (templateId: string) => void;
}

type ElementKey = keyof Template['elements'];
type FontKey = keyof Template['fonts'];

const TemplateEditor: React.FC<TemplateEditorProps> = ({ templates: initialTemplates, onSave, onClose, currentUserId, onDelete }) => {
    const isTemplateActionLoading = useAppStore(state => state.isTemplateActionLoading);
    const [templates, setTemplates] = useState<Template[]>(() => JSON.parse(JSON.stringify(initialTemplates)));
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>(templates[0]?.id || null);
    const [selectedElementKey, setSelectedElementKey] = useState<ElementKey | null>(null);
    const [showForeignTemplates, setShowForeignTemplates] = useState(true);
    const [filterText, setFilterText] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTemplates(JSON.parse(JSON.stringify(initialTemplates)));
        if (!initialTemplates.some(t => t.id === activeTemplateId)) {
            setActiveTemplateId(initialTemplates[0]?.id || null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialTemplates]);

    const activeTemplate = templates.find(t => t.id === activeTemplateId);

    const handleToggleForeignTemplates = (show: boolean) => {
        setShowForeignTemplates(show);
        if (!show) {
            const activeTpl = templates.find(t => t.id === activeTemplateId);
            if (activeTpl && activeTpl.user_id !== currentUserId) {
                const firstUserTemplate = templates.find(t => t.user_id === currentUserId);
                setActiveTemplateId(firstUserTemplate?.id || null);
                setSelectedElementKey(null);
            }
        }
    };

    const handleDelete = (template: Template) => {
        if (window.confirm(`Opravdu si přejete smazat šablonu "${template.name}"? Tato akce je nevratná.`)) {
            if (activeTemplateId === template.id) {
                const remainingTemplates = templates.filter(t => t.id !== template.id && (showForeignTemplates || t.user_id === currentUserId));
                setActiveTemplateId(remainingTemplates[0]?.id || null);
                setSelectedElementKey(null);
            }
            onDelete(template.id);
        }
    };

    const filteredTemplates = templates
        .filter(t => showForeignTemplates || t.user_id === currentUserId)
        .filter(t => t.name.toLowerCase().includes(filterText.toLowerCase()));

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
        if (currentUserId === null) return;
        const templateToDuplicate = templates.find(t => t.id === idToDuplicate);
        if (!templateToDuplicate) return;
        
        const newTemplate: Template = JSON.parse(JSON.stringify(templateToDuplicate));
        newTemplate.id = `new-${Date.now()}`;
        newTemplate.name = `${templateToDuplicate.name} (Kopie)`;
        newTemplate.user_id = currentUserId;
        delete newTemplate.authorUsername;

        setTemplates(prev => [...prev, newTemplate]);
        setActiveTemplateId(newTemplate.id);
    };
    
    const handleAddNewTemplate = () => {
        if (currentUserId === null) return;
        const baseTemplate = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES[0])); 
        const newTemplate: Template = { ...baseTemplate, id: `new-${Date.now()}`, name: 'Nová šablona', user_id: currentUserId };
        setTemplates(prev => [...prev, newTemplate]);
        setActiveTemplateId(newTemplate.id);
    };
    
     const handleFrameImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeTemplate) return;
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                handleUpdateTemplate({ ...activeTemplate, frameImageUrl: event.target?.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAndClose = () => onSave(templates);
    
    const getFontKeyFromElement = (elementKey: ElementKey): FontKey | null => {
        const keyMap: Partial<Record<ElementKey, FontKey>> = {
            title: 'title', typeLine: 'typeLine', textBox: 'rulesText',
            ptBox: 'pt', artist: 'artist', collectorNumber: 'collectorNumber',
        };
        return keyMap[elementKey] || null;
    };
    
    const handleResetGradient = () => {
        if (!activeTemplate) return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { gradientStartColor, gradientEndColor, gradientAngle, gradientOpacity, ...rest } = activeTemplate;
        handleUpdateTemplate(rest as Template);
    };

    const renderTemplateProperties = () => {
        if (!activeTemplate) return null;
        const isAuthorOfActive = activeTemplate.user_id === currentUserId;

        return (
            <div className="p-4 border-t border-gray-700">
                <h4 className="text-lg font-bold text-yellow-300 mb-2">Vlastnosti šablony</h4>
                {!isAuthorOfActive && (
                    <div className="p-2 mb-4 text-sm bg-yellow-900/50 border border-yellow-700 text-yellow-300 rounded-md">
                        Tuto šablonu vlastní uživatel "{activeTemplate.authorUsername || 'neznámý'}". Můžete si ji prohlížet a duplikovat, ale nemůžete ji upravovat.
                    </div>
                )}
                <div className="space-y-4 text-sm">
                    <div>
                       <label className="font-bold text-gray-400">Název šablony</label>
                       <input type="text" value={activeTemplate.name} onChange={(e) => handleUpdateTemplate({ ...activeTemplate, name: e.target.value })} className="w-full bg-gray-700 p-2 rounded border border-gray-600 mt-1 disabled:opacity-50" disabled={!isAuthorOfActive} />
                    </div>
                    <fieldset disabled={!isAuthorOfActive} className="disabled:opacity-50">
                        <div className="space-y-3 pt-3 border-t border-gray-600">
                            <h5 className="font-bold text-gray-300">Barevné úpravy</h5>
                            <div>
                                <label className="font-medium text-gray-400">Saturace ({((activeTemplate.saturation ?? 1) * 100).toFixed(0)}%)</label>
                                <input type="range" min="0" max="2" step="0.05" value={activeTemplate.saturation ?? 1} onChange={e => handleUpdateTemplate({ ...activeTemplate, saturation: parseFloat(e.target.value) })} className="w-full mt-1"/>
                            </div>
                            <div>
                                <label className="font-medium text-gray-400">Odstín ({activeTemplate.hue ?? 0}deg)</label>
                                <input type="range" min="0" max="360" step="1" value={activeTemplate.hue ?? 0} onChange={e => handleUpdateTemplate({...activeTemplate, hue: parseInt(e.target.value) })} className="w-full mt-1"/>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-gray-700/50">
                                <label className="font-medium text-gray-400">Barevný přechod (přes masku)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><span className="text-xs text-gray-500">Od</span><input type="color" value={activeTemplate.gradientStartColor ?? '#000000'} onChange={e => handleUpdateTemplate({...activeTemplate, gradientStartColor: e.target.value})} className="w-full bg-gray-700 p-0 h-9 border-gray-600 cursor-pointer"/></div>
                                    <div><span className="text-xs text-gray-500">Do</span><input type="color" value={activeTemplate.gradientEndColor ?? '#ffffff'} onChange={e => handleUpdateTemplate({...activeTemplate, gradientEndColor: e.target.value})} className="w-full bg-gray-700 p-0 h-9 border-gray-600 cursor-pointer"/></div>
                                </div>
                                <div><label className="text-xs text-gray-500">Úhel</label><input type="range" min="0" max="360" step="1" value={activeTemplate.gradientAngle ?? 180} onChange={e => handleUpdateTemplate({...activeTemplate, gradientAngle: parseInt(e.target.value)})} className="w-full"/></div>
                                <div><label className="text-xs text-gray-500">Průhlednost</label><input type="range" min="0" max="1" step="0.05" value={activeTemplate.gradientOpacity ?? 0.5} onChange={e => handleUpdateTemplate({...activeTemplate, gradientOpacity: parseFloat(e.target.value)})} className="w-full"/></div>
                                <button onClick={handleResetGradient} className="w-full py-1 px-2 rounded-md bg-gray-600 hover:bg-red-700 text-xs transition-colors">Resetovat přechod</button>
                            </div>
                        </div>
                    </fieldset>
                </div>
            </div>
        );
    };

    const renderElementProperties = () => {
        if (!activeTemplate || !selectedElementKey) return (
            <div className="p-4 text-gray-400">Vyberte element ze seznamu pro úpravu jeho vlastností.</div>
        );

        const isAuthorOfActive = activeTemplate.user_id === currentUserId;
        const element = activeTemplate.elements[selectedElementKey];
        const fontKey = getFontKeyFromElement(selectedElementKey);
        const font = fontKey ? activeTemplate.fonts[fontKey] : null;

        const handleElementChange = (prop: keyof TemplateElement, value: string | boolean) => {
            const updatedValue = typeof value === 'string' ? (parseFloat(value) || 0) : value;
            handleUpdateElement(selectedElementKey, { ...element, [prop]: updatedValue });
        };
        
        const handleFontChange = (prop: keyof FontProperties, value: any) => {
            if (!fontKey) return;
            const finalValue = prop === 'fontSize' ? parseInt(value, 10) : value;
            handleUpdateFont(fontKey, { [prop]: finalValue });
        };

        return (
             <fieldset disabled={!isAuthorOfActive} className="disabled:opacity-50 p-4 border-t border-gray-700">
                <h4 className="text-lg font-bold text-yellow-300 mb-2 capitalize">{selectedElementKey.replace(/([A-Z])/g, ' $1')}</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-md">
                        <input type="checkbox" id="elementVisible" checked={element.visible ?? true} onChange={(e) => handleElementChange('visible', e.target.checked)} className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 cursor-pointer"/>
                        <label htmlFor="elementVisible" className="font-bold text-gray-300 select-none cursor-pointer">Element je viditelný</label>
                    </div>
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
                            <label>Family: <select value={font.fontFamily ?? ''} onChange={e => handleFontChange('fontFamily', e.target.value)} className="w-full bg-gray-700 p-1 rounded border border-gray-600">{AVAILABLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}</select></label>
                            <div className="grid grid-cols-2 gap-2">
                              <label>Size (px): <input type="number" value={font.fontSize ?? 16} onChange={e => handleFontChange('fontSize', e.target.value)} className="w-full bg-gray-700 p-1 rounded border border-gray-600" /></label>
                              <label>Color: <input type="color" value={font.color ?? '#000000'} onChange={e => handleFontChange('color', e.target.value)} className="w-full bg-gray-700 p-0 h-8 border-gray-600 cursor-pointer" /></label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                               <label>Align: <select value={font.textAlign ?? 'left'} onChange={e => handleFontChange('textAlign', e.target.value as 'left' | 'center' | 'right')} className="w-full bg-gray-700 p-1 rounded border border-gray-600"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
                               <label>Weight: <select value={font.fontWeight ?? 'normal'} onChange={e => handleFontChange('fontWeight', e.target.value as 'normal' | 'bold')} className="w-full bg-gray-700 p-1 rounded border border-gray-600"><option value="normal">Normal</option><option value="bold">Bold</option></select></label>
                            </div>
                        </>
                    )}
                </div>
            </fieldset>
        );
    };

    const generateMaskedGradientStyle = (template: Template): React.CSSProperties => {
        if (!template.gradientStartColor || !template.gradientEndColor || !template.frameImageUrl) return {};
        return {
            background: `linear-gradient(${template.gradientAngle ?? 180}deg, ${template.gradientStartColor}, ${template.gradientEndColor})`,
            opacity: template.gradientOpacity ?? 0.5,
            maskImage: `url("${template.frameImageUrl}")`, maskSize: '100% 100%', maskRepeat: 'no-repeat', maskMode: 'alpha',
            WebkitMaskImage: `url("${template.frameImageUrl}")`, WebkitMaskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat',
        };
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] border border-gray-700 flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-2xl font-beleren text-yellow-300">Template Editor</h3>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleSaveAndClose} 
                            disabled={isTemplateActionLoading}
                            className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-wait"
                        >
                            {isTemplateActionLoading ? 'Ukládám...' : 'Uložit & Zavřít'}
                        </button>
                        <button 
                            onClick={onClose} 
                            disabled={isTemplateActionLoading}
                            className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 disabled:opacity-50"
                        >
                            Zrušit
                        </button>
                    </div>
                </header>
                
                <div className="flex-grow flex overflow-hidden">
                    <aside className="w-1/4 bg-gray-900/50 p-4 flex flex-col">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-bold text-yellow-300">Šablony</h4>
                                <div className="flex items-center text-sm">
                                    <input type="checkbox" id="showForeign" checked={showForeignTemplates} onChange={(e) => handleToggleForeignTemplates(e.target.checked)} className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 cursor-pointer"/>
                                    <label htmlFor="showForeign" className="ml-2 text-gray-300 select-none cursor-pointer">Zobrazit cizí</label>
                                </div>
                            </div>
                            <input type="text" placeholder="Filtrovat podle názvu..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition mb-2"/>
                        </div>
                        <div className="space-y-2 flex-grow overflow-y-auto pr-2">
                            {filteredTemplates.map(t => (
                                <div key={t.id} className={`flex items-center justify-between p-2 rounded cursor-pointer ${activeTemplateId === t.id ? 'bg-yellow-400/20' : 'hover:bg-gray-700'}`} onClick={() => handleSelectTemplate(t.id)}>
                                    <div className="flex-grow truncate pr-2"><span>{t.name}</span>{t.user_id !== currentUserId && (<span className="text-xs text-gray-400 ml-2">(od {t.authorUsername || 'neznámý'})</span>)}</div>
                                    <div className="flex items-center flex-shrink-0">
                                        <button title="Duplikovat šablonu" onClick={(e) => { e.stopPropagation(); handleDuplicateTemplate(t.id); }} className="text-gray-400 hover:text-white p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                                        {t.user_id === currentUserId && (<button title="Smazat šablonu" onClick={(e) => { e.stopPropagation(); handleDelete(t); }} className="text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>)}
                                    </div>
                                </div>
                            ))}
                            {filteredTemplates.length === 0 && (<div className="p-2 text-center text-sm text-gray-400">Žádné šablony.</div>)}
                        </div>
                        <button onClick={handleAddNewTemplate} className="w-full mt-4 py-2 px-4 rounded-md bg-blue-700 hover:bg-blue-600 text-sm transition-colors flex-shrink-0">+ Přidat novou šablonu</button>
                    </aside>

                    <main className="w-1/2 flex flex-col p-4 bg-gray-900 border-x border-gray-700 overflow-y-auto">
                        <div className="flex-shrink-0 flex items-center justify-center">
                             {activeTemplate ? (
                                <div className="w-[375px] h-[525px] rounded-[18px] overflow-hidden shadow-2xl relative select-none bg-black" onClick={() => setSelectedElementKey(null)}>
                                    <img src={activeTemplate.frameImageUrl} alt="Template Frame" className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1, filter: `saturate(${activeTemplate.saturation ?? 1}) hue-rotate(${activeTemplate.hue ?? 0}deg)`}}/>
                                    <div className="absolute inset-0 pointer-events-none" style={{ ...generateMaskedGradientStyle(activeTemplate), zIndex: 2 }}/>
                                    
                                    {(Object.keys(activeTemplate.elements) as ElementKey[]).map(key => {
                                        const fontKey = getFontKeyFromElement(key);
                                        const fontStyle = fontKey ? activeTemplate.fonts[fontKey] : undefined;

                                        return (
                                            (activeTemplate.elements[key].visible ?? true) && (
                                                <DraggableResizableBox 
                                                    key={key} 
                                                    id={key} 
                                                    position={activeTemplate.elements[key]} 
                                                    onUpdate={(newPos) => { if (activeTemplate.user_id === currentUserId) { handleUpdateElement(key, newPos); }}} 
                                                    isSelected={selectedElementKey === key} 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedElementKey(key); }}
                                                    fontStyle={fontStyle}
                                                >
                                                  {key.replace(/([A-Z])/g, ' $1')}
                                                </DraggableResizableBox>
                                            )
                                        )
                                    })}
                                </div>
                            ) : (<div className="text-gray-400">Žádná šablona k zobrazení.</div>)}
                        </div>
                        <div className="flex-grow mt-4">
                            {renderTemplateProperties()}
                        </div>
                    </main>

                    <aside className="w-1/4 bg-gray-900/50 flex flex-col overflow-hidden">
                        {activeTemplate ? (
                            <>
                                <div className="p-4 flex-shrink-0">
                                    <h4 className="text-lg font-bold text-yellow-300 mb-2">Obrázek rámečku</h4>
                                    <div className="w-full max-w-[150px] mx-auto"> 
                                        <img 
                                            src={activeTemplate.frameImageUrl} 
                                            alt="Frame Preview" 
                                            className="w-full rounded border border-gray-600 my-2 aspect-[375/525] object-contain bg-black" 
                                        />
                                    </div>
                                    <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} className="hidden" onChange={handleFrameImageUpload} />
                                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-sm transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={activeTemplate.user_id !== currentUserId}>Změnit obrázek</button>
                                </div>
                                <div className="p-4 border-t border-gray-700 flex-shrink-0">
                                    <h4 className="text-lg font-bold text-yellow-300 mb-2">Elementy</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {(Object.keys(activeTemplate.elements) as ElementKey[]).map(key => (
                                            <button key={key} onClick={() => setSelectedElementKey(key)} className={`p-2 rounded capitalize text-left transition-colors ${selectedElementKey === key ? 'bg-yellow-400/20 text-yellow-200' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                                {key.replace(/([A-Z])/g, ' $1')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-grow overflow-y-auto">
                                    {renderElementProperties()}
                                </div>
                            </>
                        ) : (<div className="p-4 text-gray-400">Vyberte šablonu.</div>)}
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default TemplateEditor;