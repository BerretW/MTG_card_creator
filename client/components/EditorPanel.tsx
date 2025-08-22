import React, { useRef, useState } from "react";
import { CardData, CardType, Rarity } from "../types";
import { SET_SYMBOLS } from "../constants";
import ArtEditor from "./ArtEditor";
import AITextGeneratorModal from "./AITextGeneratorModal";
import { CardTextResult } from "../services/aiService";

import { useAppStore } from '../store/appStore';
import { useUiStore } from '../store/uiStore';

const EditorPanel: React.FC = () => {
  const { 
    cardData, 
    setCardData,
    templates,
    artAssets,
    updateArt,
    customSetSymbols,
    addCustomSetSymbol 
  } = useAppStore();

  const openTemplateEditor = useUiStore(state => state.openTemplateEditor);

  const [isTextGeneratorOpen, setIsTextGeneratorOpen] = useState(false);
  
  const selectedTemplate = templates.find(t => t.id === cardData.templateId);
  const customSymbolInputRef = useRef<HTMLInputElement>(null);

  const handleCustomSymbolUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const name = prompt(
        "Zadejte název pro tento symbol sady:",
        file.name.replace(/\.[^/.]+$/, "")
      );
      if (name) {
        const reader = new FileReader();
        reader.onload = (e) => {
          addCustomSetSymbol(name, e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
    if (event.target) event.target.value = "";
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setCardData({
        customFields: {
            ...(cardData.customFields || {}),
            [key]: value,
        }
    });
  };

  const allSetSymbols = [
    ...Object.values(SET_SYMBOLS),
    ...customSetSymbols.map((s) => ({ name: s.name, url: s.url })),
  ];

  const handleTextareaScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
  };
  
  const handleAITextGenerated = (result: CardTextResult) => {
    setCardData({
        rulesText: result.rulesText,
        flavorText: result.flavorText,
    });
  };

  if (!selectedTemplate) {
    return <div className="text-gray-400">Načítání šablony...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-beleren text-yellow-200 border-b-2 border-yellow-200/20 pb-2">
          Card Editor
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="name"
            label="Name"
            value={cardData.name}
            onChange={(e) => setCardData({ name: e.target.value })}
          />
          <Input
            id="manaCost"
            label="Mana Cost"
            value={cardData.manaCost}
            onChange={(e) => setCardData({ manaCost: e.target.value })}
            placeholder="{2}{W}{U}"
          />
        </div>

        <ArtEditor
          art={cardData.art}
          artAssets={artAssets}
          onArtUpdate={updateArt}
          aspectRatio={selectedTemplate.elements.art.width / selectedTemplate.elements.art.height}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Card Type"
            value={cardData.cardType}
            onChange={(e) => setCardData({ cardType: e.target.value as CardType })}
          >
            {Object.values(CardType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Input
            id="subtype"
            label="Subtype"
            value={cardData.subtype}
            onChange={(e) => setCardData({ subtype: e.target.value })}
            placeholder="Elf Druid"
          />
        </div>

        {selectedTemplate.elements.customElements && selectedTemplate.elements.customElements.length > 0 && (
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 space-y-4">
                <h3 className="text-lg font-beleren text-yellow-100">Doplňující pole</h3>
                {selectedTemplate.elements.customElements.map(el => (
                    <Input
                        key={el.key}
                        id={el.key}
                        label={el.label}
                        value={cardData.customFields?.[el.key] ?? ''}
                        onChange={(e) => handleCustomFieldChange(el.key, e.target.value)}
                    />
                ))}
            </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-1">
              <label htmlFor="rulesText" className="block text-sm font-medium text-gray-300">Rules Text</label>
              <button 
                  onClick={() => setIsTextGeneratorOpen(true)}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-2 rounded-md transition"
              >
                  Generate with AI...
              </button>
          </div>
          <Textarea
              id="rulesText"
              value={cardData.rulesText}
              onChange={(e) => setCardData({ rulesText: e.target.value })}
              rows={4}
              onWheel={handleTextareaScroll}
          />
        </div>
        
        <Textarea
          id="flavorText"
          label="Flavor Text"
          value={cardData.flavorText}
          onChange={(e) => setCardData({ flavorText: e.target.value })}
          rows={2}
        />

        {cardData.cardType === CardType.Creature && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="power"
              label="Power"
              value={cardData.power}
              onChange={(e) => setCardData({ power: e.target.value })}
            />
            <Input
              id="toughness"
              label="Toughness"
              value={cardData.toughness}
              onChange={(e) => setCardData({ toughness: e.target.value })}
            />
          </div>
        )}

        <Select
          label="Rarity"
          value={cardData.rarity}
          onChange={(e) => setCardData({ rarity: e.target.value as Rarity })}
        >
          {Object.values(Rarity).map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity}
            </option>
          ))}
        </Select>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Set Symbol
          </label>
          <div className="flex gap-2">
            <select
              value={cardData.setSymbolUrl}
              onChange={(e) => setCardData({ setSymbolUrl: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            >
              {allSetSymbols.map((symbol) => (
                <option key={symbol.url} value={symbol.url}>
                  {symbol.name}
                </option>
              ))}
            </select>
            <input
              type="file"
              ref={customSymbolInputRef}
              className="hidden"
              accept="image/svg+xml, image/png"
              onChange={handleCustomSymbolUpload}
            />
            <button
              onClick={() => customSymbolInputRef.current?.click()}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition text-center text-sm flex-shrink-0"
            >
              Upload
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="artist"
            label="Artist"
            value={cardData.artist}
            onChange={(e) => setCardData({ artist: e.target.value })}
          />
          <Input
            id="collectorNumber"
            label="Collector #"
            value={cardData.collectorNumber}
            onChange={(e) => setCardData({ collectorNumber: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Template
          </label>
          <div className="flex gap-2">
            <select
              value={cardData.templateId}
              onChange={(e) => setCardData({ templateId: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <button
              onClick={openTemplateEditor}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition text-center"
            >
              Manage
            </button>
          </div>
        </div>
      </div>
      
      {isTextGeneratorOpen && (
          <AITextGeneratorModal
              onClose={() => setIsTextGeneratorOpen(false)}
              onGenerate={handleAITextGenerated}
          />
      )}
    </>
  );
};

// Pomocné komponenty (Input, Textarea, Select)

const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }
> = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
    />
  </div>
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  id: string;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, ...props }, ref) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <textarea
        id={id}
        {...props}
        ref={ref}
        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
      />
    </div>
  )
);
Textarea.displayName = "Textarea";

const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }
> = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <select
      {...props}
      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
    >
      {children}
    </select>
  </div>
);

export default EditorPanel;