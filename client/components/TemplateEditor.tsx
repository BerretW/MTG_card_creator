import React, { useState } from "react";
import { Template, TemplateElement, FontProperties } from "../types";
import DraggableResizableBox from "./DraggableResizableBox";
import { AVAILABLE_FONTS } from "../constants";

interface TemplateEditorProps {
  templates: Template[];
  onSave: (templates: Template[]) => void;
  onClose: () => void;
}

type ElementKey = keyof Template["elements"];
type FontKey = keyof Template["fonts"];

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  templates: initialTemplates,
  onSave,
  onClose,
}) => {
  const [templates, setTemplates] = useState<Template[]>(() =>
    JSON.parse(JSON.stringify(initialTemplates))
  );
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    templates[0]?.id || null
  );
  const [selectedElementKey, setSelectedElementKey] =
    useState<ElementKey | null>(null);

  const activeTemplate = templates.find((t) => t.id === activeTemplateId);

  const handleSelectTemplate = (id: string) => {
    setActiveTemplateId(id);
    setSelectedElementKey(null);
  };

  const handleUpdateTemplate = (updatedTemplate: Template) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    );
  };

  const handleUpdateElement = (
    key: ElementKey,
    newPosition: TemplateElement
  ) => {
    if (!activeTemplate) return;
    const updatedTemplate = {
      ...activeTemplate,
      elements: { ...activeTemplate.elements, [key]: newPosition },
    };
    handleUpdateTemplate(updatedTemplate);
  };

  const handleUpdateFont = (
    key: FontKey,
    newFontProps: Partial<FontProperties>
  ) => {
    if (!activeTemplate) return;
    const updatedTemplate = {
      ...activeTemplate,
      fonts: {
        ...activeTemplate.fonts,
        [key]: { ...activeTemplate.fonts[key], ...newFontProps },
      },
    };
    handleUpdateTemplate(updatedTemplate);
  };

  const handleAddNewTemplate = () => {
    const newId = `custom-${Date.now()}`;
    const baseTemplate = activeTemplate || templates[0];
    const newTemplate: Template = JSON.parse(JSON.stringify(baseTemplate));

    newTemplate.id = newId;
    newTemplate.name = `${newTemplate.name} Copy`;

    setTemplates((prev) => [...prev, newTemplate]);
    setActiveTemplateId(newId);
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      alert("Cannot delete the last template.");
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (activeTemplateId === id) {
      setActiveTemplateId(templates[0]?.id || null);
    }
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeTemplate) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleUpdateTemplate({
          ...activeTemplate,
          frameImageUrl: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAndClose = () => {
    onSave(templates);
    onClose();
  };

  const getFontKeyFromElement = (elementKey: ElementKey): FontKey | null => {
    const map: Partial<Record<ElementKey, FontKey>> = {
      title: "title",
      typeLine: "typeLine",
      textBox: "rulesText", // Represents the whole box, main font is rulesText
      ptBox: "pt",
      artist: "artist",
      collectorNumber: "collectorNumber",
    };
    return map[elementKey] || null;
  };

  const renderPropertyControls = () => {
    if (!activeTemplate || !selectedElementKey) {
      return (
        <p className="text-gray-400">
          Select an element on the card to edit its properties.
        </p>
      );
    }

    const element = activeTemplate.elements[selectedElementKey];
    const fontKey = getFontKeyFromElement(selectedElementKey);
    const fontProps = fontKey ? activeTemplate.fonts[fontKey] : null;

    const handlePropChange = (prop: keyof TemplateElement, value: string) => {
      handleUpdateElement(selectedElementKey, {
        ...element,
        [prop]: parseFloat(value) || 0,
      });
    };

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-bold capitalize text-yellow-300">
          {selectedElementKey} Properties
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {(["x", "y", "width", "height"] as const).map((prop) => (
            <div key={prop}>
              <label className="text-xs">{prop.toUpperCase()} (%)</label>
              <input
                type="number"
                step="0.1"
                value={element[prop]}
                onChange={(e) => handlePropChange(prop, e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm"
              />
            </div>
          ))}
        </div>

        {fontKey && fontProps && (
          <div className="space-y-2 pt-2 border-t border-gray-600">
            <h4 className="text-lg font-bold capitalize text-yellow-300">
              Font Properties
            </h4>
            <div>
              <label className="text-xs">Font Family</label>
              <select
                value={fontProps.fontFamily}
                onChange={(e) =>
                  handleUpdateFont(fontKey, { fontFamily: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs">Font Size (px)</label>
                <input
                  type="number"
                  value={fontProps.fontSize}
                  onChange={(e) =>
                    handleUpdateFont(fontKey, {
                      fontSize: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs">Color</label>
                <input
                  type="color"
                  value={fontProps.color}
                  onChange={(e) =>
                    handleUpdateFont(fontKey, { color: e.target.value })
                  }
                  className="w-full bg-gray-900 border-gray-600 rounded h-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-xs">Bold</label>
              <input
                type="checkbox"
                checked={fontProps.fontWeight === "bold"}
                onChange={(e) =>
                  handleUpdateFont(fontKey, {
                    fontWeight: e.target.checked ? "bold" : "normal",
                  })
                }
                className="form-checkbox h-4 w-4 text-yellow-400 bg-gray-900 border-gray-600 rounded focus:ring-yellow-400"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] border border-gray-700 flex flex-col">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-2xl font-beleren text-yellow-300">
            Template Editor
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveAndClose}
              className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-700 transition"
            >
              Save & Close
            </button>
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </header>

        <div className="flex-grow flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-1/4 bg-gray-900/50 p-4 space-y-4 overflow-y-auto">
            <div>
              <h4 className="text-lg font-bold text-yellow-300 mb-2">
                Templates
              </h4>
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                      activeTemplateId === t.id
                        ? "bg-yellow-400/20"
                        : "hover:bg-gray-700"
                    }`}
                    onClick={() => handleSelectTemplate(t.id)}
                  >
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) =>
                        handleUpdateTemplate({ ...t, name: e.target.value })
                      }
                      className="bg-transparent text-white w-full"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(t.id);
                      }}
                      className="text-red-500 hover:text-red-400 text-xs"
                    >
                      DEL
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddNewTemplate}
                className="w-full mt-2 py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 transition text-sm"
              >
                New/Duplicate
              </button>
            </div>
            <hr className="border-gray-600" />
            {activeTemplate && (
              <div>
                <h4 className="text-lg font-bold text-yellow-300 mb-2">
                  Frame Image
                </h4>
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleFrameUpload}
                  className="text-sm w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                />
              </div>
            )}
            <hr className="border-gray-600" />
            {renderPropertyControls()}
          </aside>

          {/* Main Content */}
          <main className="w-3/4 flex items-center justify-center p-4 bg-gray-900">
            {activeTemplate && (
              <div
                className="w-[375px] h-[525px] rounded-[18px] overflow-hidden shadow-2xl relative select-none bg-black"
                // Odebrali jsme styl pro backgroundImage
              >
                {/* Přidáme rámeček jako obrázek, stejně jako v CardPreview */}
                <img
                  src={activeTemplate.frameImageUrl}
                  alt="Template Frame"
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 1 }}
                />

                {/* Draggable boxy se nyní vykreslí nad tímto obrázkem */}
                {(Object.keys(activeTemplate.elements) as ElementKey[]).map(
                  (key) => (
                    <DraggableResizableBox
                      key={key}
                      id={key}
                      position={activeTemplate.elements[key]}
                      onUpdate={(newPos) => handleUpdateElement(key, newPos)}
                      isSelected={selectedElementKey === key}
                      onClick={() => setSelectedElementKey(key)}
                    >
                      <span className="text-xs text-white/50">{key}</span>
                    </DraggableResizableBox>
                  )
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
