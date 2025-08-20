import React, { useState, useRef, useCallback, MouseEvent } from 'react';
import { TemplateElement } from '../types';

interface DraggableResizableBoxProps {
    id: string;
    position: TemplateElement;
    onUpdate: (position: TemplateElement) => void;
    isSelected: boolean;
    onClick: (event: MouseEvent<HTMLDivElement>) => void;
    children: React.ReactNode;
}

type DragAction = 'move' | 'resize-br' | null;

const DraggableResizableBox: React.FC<DraggableResizableBoxProps> = ({ position, onUpdate, isSelected, onClick, children }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const [action, setAction] = useState<DragAction>(null);
    const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });
    const [startPosition, setStartPosition] = useState(position);

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
        // ZVÝŠENÍ Z-INDEX, ABY BYL NAD PŘECHODEM
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

    return (
        <div ref={boxRef} style={boxStyle} onMouseDown={(e) => handleMouseDown(e, 'move')}>
            <div className="w-full h-full flex items-center justify-center bg-black/30">
                {children}
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