
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ArtCropperProps {
    imageUrl: string;
    aspectRatio: number;
    onCrop: (dataUrl: string) => void;
    onClose: () => void;
}

const ArtCropper: React.FC<ArtCropperProps> = ({ imageUrl, aspectRatio, onCrop, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(new Image());
    const containerRef = useRef<HTMLDivElement>(null);

    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const draw = useCallback(() => {
        const image = imageRef.current;
        if (!image.src) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const container = containerRef.current;
        if (!container) return;

        // Set canvas to display size for sharp rendering
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const imageAspectRatio = image.naturalWidth / image.naturalHeight;
        
        let initialWidth, initialHeight;

        if (imageAspectRatio > aspectRatio) {
            initialHeight = canvas.height;
            initialWidth = initialHeight * imageAspectRatio;
        } else {
            initialWidth = canvas.width;
            initialHeight = initialWidth / imageAspectRatio;
        }

        const scaledWidth = initialWidth * zoom;
        const scaledHeight = initialHeight * zoom;

        // Clamp offsets
        const maxOffsetX = (scaledWidth - canvas.width) / 2;
        const maxOffsetY = (scaledHeight - canvas.height) / 2;
        const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x));
        const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y));

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
            image,
            canvas.width / 2 - scaledWidth / 2 + clampedX,
            canvas.height / 2 - scaledHeight / 2 + clampedY,
            scaledWidth,
            scaledHeight
        );
    }, [zoom, offset, aspectRatio]);


    useEffect(() => {
        const image = imageRef.current;
        image.crossOrigin = "anonymous";
        image.src = imageUrl;
        image.onload = () => {
            setZoom(1);
            setOffset({x: 0, y: 0});
            draw();
        };
    }, [imageUrl, draw]);
    
    useEffect(() => {
        draw();
    }, [draw, zoom, offset]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const newZoom = zoom - e.deltaY * 0.001;
        setZoom(Math.max(1, newZoom));
    };

    const handleCrop = () => {
        const image = imageRef.current;
        const canvas = document.createElement('canvas');

        const desiredWidth = 800;
        canvas.width = desiredWidth;
        canvas.height = desiredWidth / aspectRatio;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const imageAspectRatio = image.naturalWidth / image.naturalHeight;
        
        let initialWidth, initialHeight;
        if (imageAspectRatio > aspectRatio) {
            initialHeight = canvas.height;
            initialWidth = initialHeight * imageAspectRatio;
        } else {
            initialWidth = canvas.width;
            initialHeight = initialWidth / imageAspectRatio;
        }
        
        const scaledWidth = initialWidth * zoom;
        const scaledHeight = initialHeight * zoom;

        const maxOffsetX = (scaledWidth - canvas.width) / 2;
        const maxOffsetY = (scaledHeight - canvas.height) / 2;
        const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x));
        const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y));

        ctx.drawImage(
            image,
            canvas.width / 2 - scaledWidth / 2 + clampedX,
            canvas.height / 2 - scaledHeight / 2 + clampedY,
            scaledWidth,
            scaledHeight
        );
        onCrop(canvas.toDataURL('image/jpeg', 0.9));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-700 flex flex-col">
                <h3 className="text-xl font-beleren text-yellow-300 mb-4">Crop & Position Art</h3>
                <div 
                    ref={containerRef}
                    className="w-full bg-gray-900 overflow-hidden relative" 
                    style={{ aspectRatio: `${aspectRatio}` }}
                    onMouseLeave={handleMouseUp}
                >
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full cursor-grab"
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onWheel={handleWheel}
                    />
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <label className="text-sm">Zoom:</label>
                    <input 
                        type="range" 
                        min="1" 
                        max="3" 
                        step="0.01" 
                        value={zoom} 
                        onChange={e => setZoom(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 transition">Cancel</button>
                    <button onClick={handleCrop} className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-700 transition">Confirm Crop</button>
                </div>
            </div>
        </div>
    );
};

export default ArtCropper;
