import React, { useRef, useState, useCallback } from "react";
import {
  CardData,
  CardType,
  Rarity,
  Template,
  ArtAsset,
  CustomSetSymbol,
  CardArt,
} from "../types";
import { SET_SYMBOLS, MANA_SYMBOLS } from "../constants";
import ArtEditor from "./ArtEditor";

interface EditorPanelProps {
  cardData: CardData;
  setCardData: React.Dispatch<React.SetStateAction<CardData>>;
  templates: Template[];
  onOpenTemplateEditor: () => void;
  artAssets: ArtAsset[];
  onArtUpdate: (originalUrl: string, croppedUrl: string) => void;
  customSetSymbols: CustomSetSymbol[];
  onAddCustomSetSymbol: (name: string, dataUrl: string) => void;
  template: Template;
}
const AVAILABLE_SYMBOLS: { key: string; label: string; preview: string }[] = [
  { key: "W", label: "White Mana", preview: MANA_SYMBOLS["W"] },
  { key: "U", label: "Blue Mana", preview: MANA_SYMBOLS["U"] },
  { key: "B", label: "Black Mana", preview: MANA_SYMBOLS["B"] },
  { key: "R", label: "Red Mana", preview: MANA_SYMBOLS["R"] },
  { key: "G", label: "Green Mana", preview: MANA_SYMBOLS["G"] },
  { key: "C", label: "Colorless", preview: MANA_SYMBOLS["C"] },
  { key: "W/P", label: "Tap", preview: MANA_SYMBOLS["W/P"] },
  { key: "U/P", label: "Tap", preview: MANA_SYMBOLS["U/P"] },
  { key: "B/P", label: "Tap", preview: MANA_SYMBOLS["B/P"] },
  { key: "R/P", label: "Tap", preview: MANA_SYMBOLS["R/P"] },
  { key: "G/P", label: "Tap", preview: MANA_SYMBOLS["G/P"] },
  { key: "W/U", label: "White/Blue", preview: MANA_SYMBOLS["W/U"] },
    { key: "W/B", label: "White/Black", preview: MANA_SYMBOLS["W/B"] },
    { key: "R/W", label: "Red/White", preview: MANA_SYMBOLS["R/W"] },
    { key: "G/W", label: "Green/White", preview: MANA_SYMBOLS["G/W"] },
    { key: "U/B", label: "Blue/Black", preview: MANA_SYMBOLS["U/B"] },
    { key: "U/R", label: "Blue/Red", preview: MANA_SYMBOLS["U/R"] },
    { key: "G/U", label: "Green/Blue", preview: MANA_SYMBOLS["G/U"] },
    { key: "B/R", label: "Black/Red", preview: MANA_SYMBOLS["B/R"] },
    { key: "B/G", label: "Black/Green", preview: MANA_SYMBOLS["B/G"] },
    { key: "R/G", label: "Red/Green", preview: MANA_SYMBOLS["R/G"] },


];
const EditorPanel: React.FC<EditorPanelProps> = (props) => {
  const {
    cardData,
    setCardData,
    templates,
    onOpenTemplateEditor,
    artAssets,
    onArtUpdate,
    customSetSymbols,
    onAddCustomSetSymbol,
    template,
  } = props;
  const customSymbolInputRef = useRef<HTMLInputElement>(null);
  const rulesTextRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const handleChange = <K extends keyof CardData>(
    key: K,
    value: CardData[K]
  ) => {
    setCardData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCustomSymbolUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const name = prompt(
        "Enter a name for this set symbol:",
        file.name.replace(/\.[/.]+$/, "")
      );
      if (name) {
        const reader = new FileReader();
        reader.onload = (e) => {
          onAddCustomSetSymbol(name, e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
    if (event.target) event.target.value = "";
  };

  const allSetSymbols = [
    ...Object.values(SET_SYMBOLS),
    ...customSetSymbols.map((s) => ({ name: s.name, url: s.url })),
  ];

  const insertManaSymbol = useCallback(
    (symbol: string, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const token = `{${symbol}}`;
      const currentValue = cardData.rulesText ?? "";
      const textarea = rulesTextRef.current;

      let start = cursorPosition ?? currentValue.length;
      let end = start;

      if (textarea && document.activeElement === textarea) {
        start = textarea.selectionStart;
        end = textarea.selectionEnd;
      }

      const newValue =
        currentValue.slice(0, start) + token + currentValue.slice(end);
      handleChange("rulesText", newValue);

      // posuň caret hned po vložení
requestAnimationFrame(() => {
  if (textarea) {
    const pos = start + token.length;
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
    setCursorPosition(pos);
  }
});
    },
    [cardData.rulesText, cursorPosition, handleChange]
  );

  const handleRulesTextSelect = () => {
    if (rulesTextRef.current) {
      setCursorPosition(rulesTextRef.current.selectionStart);
    }
  };

  const handleTextareaScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
  };


  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-beleren text-yellow-200 border-b-2 border-yellow-200/20 pb-2">
        Card Editor
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Name"
          value={cardData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <Input
          label="Mana Cost"
          value={cardData.manaCost}
          onChange={(e) => handleChange("manaCost", e.target.value)}
          placeholder="{2}{W}{U}"
        />
      </div>

      <ArtEditor
        art={cardData.art}
        setArt={(art: CardArt) => handleChange("art", art)}
        artAssets={artAssets}
        onArtUpdate={onArtUpdate}
        aspectRatio={template.elements.art.width / template.elements.art.height}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Card Type"
          value={cardData.cardType}
          onChange={(e) => handleChange("cardType", e.target.value as CardType)}
        >
          {Object.values(CardType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <Input
          label="Subtype"
          value={cardData.subtype}
          onChange={(e) => handleChange("subtype", e.target.value)}
          placeholder="Elf Druid"
        />
      </div>

      <Textarea
        label="Rules Text"
        value={cardData.rulesText}
        onChange={(e) => handleChange("rulesText", e.target.value)}
        rows={4}
        onClick={handleRulesTextSelect}
        onKeyUp={handleRulesTextSelect}
        onSelect={handleRulesTextSelect}
        ref={rulesTextRef}
        onWheel={handleTextareaScroll}
      />
<div>
  <label className="block text-sm font-medium text-gray-300 mb-1">
    Symbols & Placeholders
  </label>
  <div className="grid grid-cols-6 gap-2">
    {AVAILABLE_SYMBOLS.map((sym) => (
      <div
        key={sym.key}
        title={`Click to copy: {${sym.key}}`}
        onClick={() => {
          navigator.clipboard.writeText(`{${sym.key}}`);
        }}
        className="w-[50px] h-[50px] bg-gray-700 hover:bg-gray-600 
                   flex items-center justify-center rounded-md 
                   cursor-pointer border border-gray-500"
      >
        <div
          className="w-[32px] h-[32px] flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: sym.preview }}
        />
      </div>
    ))}
  </div>
</div>

      <Textarea
        label="Flavor Text"
        value={cardData.flavorText}
        onChange={(e) => handleChange("flavorText", e.target.value)}
        rows={2}
      />

      {cardData.cardType === CardType.Creature && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Power"
            value={cardData.power}
            onChange={(e) => handleChange("power", e.target.value)}
          />
          <Input
            label="Toughness"
            value={cardData.toughness}
            onChange={(e) => handleChange("toughness", e.target.value)}
          />
        </div>
      )}

      <Select
        label="Rarity"
        value={cardData.rarity}
        onChange={(e) => handleChange("rarity", e.target.value as Rarity)}
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
            onChange={(e) => handleChange("setSymbolUrl", e.target.value)}
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
          label="Artist"
          value={cardData.artist}
          onChange={(e) => handleChange("artist", e.target.value)}
        />
        <Input
          label="Collector #"
          value={cardData.collectorNumber}
          onChange={(e) => handleChange("collectorNumber", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Template
        </label>
        <div className="flex gap-2">
          <select
            value={cardData.templateId}
            onChange={(e) => handleChange("templateId", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            onClick={onOpenTemplateEditor}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition text-center"
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  );
};

// Pomocné komponenty
const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
    />
  </div>
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, ...props }, ref) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <textarea
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
