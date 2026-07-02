import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Eraser } from 'lucide-react';

export interface SignaturePadHandle {
    /** Returns a PNG data URL, or null if nothing has been drawn. */
    toDataUrl: () => string | null;
    clear: () => void;
}

interface SignaturePadProps {
    onChange?: (hasContent: boolean) => void;
}

/**
 * Minimal canvas-based signature capture — pointer events draw a line on a
 * <canvas>, exported as a PNG data URL. No external dependency.
 */
const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(({ onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawing = useRef(false);
    const hasContent = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const getContext = () => canvasRef.current?.getContext('2d') ?? null;

    // Resize the backing canvas to match its displayed size at device pixel ratio,
    // so strokes stay crisp and coordinates line up with the pointer.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        const ctx = getContext();
        if (ctx) {
            ctx.scale(ratio, ratio);
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#1e293b';
        }
    }, []);

    const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        isDrawing.current = true;
        lastPoint.current = getPoint(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing.current) return;
        const ctx = getContext();
        const point = getPoint(e);
        if (ctx && lastPoint.current) {
            ctx.beginPath();
            ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }
        lastPoint.current = point;
        if (!hasContent.current) {
            hasContent.current = true;
            setIsEmpty(false);
            onChange?.(true);
        }
    };

    const handlePointerUp = () => {
        isDrawing.current = false;
        lastPoint.current = null;
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = getContext();
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        hasContent.current = false;
        setIsEmpty(true);
        onChange?.(false);
    };

    useImperativeHandle(ref, () => ({
        clear,
        toDataUrl: () => (hasContent.current ? canvasRef.current?.toDataURL('image/png') ?? null : null),
    }));

    return (
        <div className="space-y-2">
            <div className="relative rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                <canvas
                    ref={canvasRef}
                    className="w-full h-40 rounded-xl touch-none cursor-crosshair"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />
                {isEmpty && (
                    <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500 pointer-events-none">
                        Draw your signature here
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={clear}
                disabled={isEmpty}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Eraser className="w-3.5 h-3.5" /> Clear
            </button>
        </div>
    );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
