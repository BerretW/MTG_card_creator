import React, { useState, useRef, useCallback, MouseEvent } from 'react';
// Přidáme import typů FontProperties a TemplateElement
import { TemplateElement, FontProperties } from '../types';

interface DraggableResizableBoxProps {
    id: string;
    position: TemplateElement;
    onUpdate: (position: TemplateElement) => void;
    isSelected: boolean;
    onClick: (event: MouseEvent<HTMLDivElement>) => void;
    children: React.ReactNode;
    fontStyle?: FontProperties; // <-- NOVÁ VOLITELNÁ PROP
}

type DragAction = 'move' | 'resize-br' | null;

const DraggableResizableBox: React.FC<DraggableResizableBoxProps> = ({ position, onUpdate, isSelected, onClick, children, fontStyle }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const [action, setAction] = useState<DragAction>(null);
    const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });
    const [startPosition, setStartPosition] = useState(position);

    // ... (všechny handlery handleMouseDown, handleMouseMove, handleMouseUp zůstávají stejné)

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>, currentAction: DragAction) => {
        e.preventDefault();
        e.stopPropagation(); 
        onClick(e); 
        
        setAction(currentAction);
        setStartMouse({ x: e.clientX, y: e.clientY });
        setStartPosition(position);
    };

    const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
        if (!action || !boxRef.current) return;

        const parentRect = boxRef.current.parentElement?.getBoundingClientRect();
        if (!parentRect) return;

        const dx = (e.clientX - startMouse.x) / parentRect.width * 100;
        const dy = (e.clientY - startMouse.y) / parentRect.height * 100;

        let newPos = { ...startPosition };

        if (action === 'move') {
            newPos.x = startPosition.x + dx;
            newPos.y = startPosition.y + dy;
        } else if (action === 'resize-br') {
            newPos.width = startPosition.width + dx;
            newPos.height = startPosition.height + dy;
        }
        
        newPos.x = Math.max(0, Math.min(100 - newPos.width, newPos.x));
        newPos.y = Math.max(0, Math.min(100 - newPos.height, newPos.y));
        newPos.width = Math.max(5, Math.min(100 - newPos.x, newPos.width));
        newPos.height = Math.max(2, Math.min(100 - newPos.y, newPos.height));

        onUpdate(newPos);

    }, [action, startMouse, startPosition, onUpdate]);

    const handleMouseUp = useCallback(() => {
        setAction(null);
    }, []);

    React.useEffect(() => {
        if (action) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [action, handleMouseMove, handleMouseUp]);


    const boxStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
        border: isSelected ? '2px solid #facc15' : '1px dashed rgba(255, 255, 255, 0.5)',
        cursor: action === 'move' ? 'grabbing' : 'grab',
        transition: action ? 'none' : 'border-color 0.2s',
        zIndex: 3,
    };

    const handleStyle: React.CSSProperties = {
        position: 'absolute',
        width: '12px',
        height: '12px',
        background: '#facc15',
        border: '2px solid #1f2937',
        borderRadius: '50%',
    };

    // --- NOVÁ LOGIKA PRO STYLOVÁNÍ TEXTU ---
    const textStyle: React.CSSProperties = fontStyle ? {
        fontFamily: fontStyle.fontFamily,
        fontSize: `${fontStyle.fontSize}px`,
        color: fontStyle.color,
        fontWeight: fontStyle.fontWeight ?? 'normal',
        fontStyle: fontStyle.fontStyle ?? 'normal',
        // Pro přehlednost v editoru text vždy centrujeme
        textAlign: 'center', 
        width: '100%',
        padding: '0 4px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    } : {
        // Výchozí styl, pokud element nemá definovaný font (např. 'art')
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'capitalize',
    };

    return (
        <div ref={boxRef} style={boxStyle} onMouseDown={(e) => handleMouseDown(e, 'move')}>
            <div className="w-full h-full flex items-center justify-center bg-black/30">
                {/* Aplikujeme nový styl na span */}
                <span style={textStyle}>{children}</span>
            </div>
            {isSelected && (
                <>
                    <div
                        style={{ ...handleStyle, bottom: '-6px', right: '-6px', cursor: 'nwse-resize' }}
                        onMouseDown={(e) => handleMouseDown(e, 'resize-br')}
                    />
                </>
            )}
        </div>
    );
};

export default DraggableResizableBox;