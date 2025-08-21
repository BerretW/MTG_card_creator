import React, { useRef } from "react";
import {
  CardData,
  CardType,
  Rarity,
  Template,
  ArtAsset,
  CustomSetSymbol,
  CardArt,
} from "../types";
import { SET_SYMBOLS } from "../constants";
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
// Poznámka: `onSymbolInsert` prop již není potřeba, protože se logika přesunula do App.tsx
// a je nezávislá na této komponentě.

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
        file.name.replace(/\.[^/.]+$/, "")
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
          id="name" // << ZMĚNA ZDE
          label="Name"
          value={cardData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <Input
          id="manaCost" // << ZMĚNA ZDE
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
          id="subtype" // << ZMĚNA ZDE
          label="Subtype"
          value={cardData.subtype}
          onChange={(e) => handleChange("subtype", e.target.value)}
          placeholder="Elf Druid"
        />
      </div>

      <Textarea
        id="rulesText" // << ZMĚNA ZDE
        label="Rules Text"
        value={cardData.rulesText}
        onChange={(e) => handleChange("rulesText", e.target.value)}
        rows={4}
        onWheel={handleTextareaScroll}
      />
      
      <Textarea
        id="flavorText" // << ZMĚNA ZDE
        label="Flavor Text"
        value={cardData.flavorText}
        onChange={(e) => handleChange("flavorText", e.target.value)}
        rows={2}
      />

      {cardData.cardType === CardType.Creature && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="power" // << ZMĚNA ZDE
            label="Power"
            value={cardData.power}
            onChange={(e) => handleChange("power", e.target.value)}
          />
          <Input
            id="toughness" // << ZMĚNA ZDE
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
          id="artist" // << ZMĚNA ZDE
          label="Artist"
          value={cardData.artist}
          onChange={(e) => handleChange("artist", e.target.value)}
        />
        <Input
          id="collectorNumber" // << ZMĚNA ZDE
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

// ======================= ZMĚNA ZDE: Přidání `id` do props =======================
const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }
> = ({ label, id, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      id={id} // <-- id se nyní předává inputu
      {...props}
      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
    />
  </div>
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  id: string; // <-- přidáno id
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, ...props }, ref) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <textarea
        id={id} // <-- id se nyní předává textarea
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