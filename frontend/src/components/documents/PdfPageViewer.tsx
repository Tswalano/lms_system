import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Loader, AlertCircle } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfProgressData {
    page: number;
    totalPages: number;
    scrollPercentage: number;
}

interface PdfPageViewerProps {
    fileUrl: string;
    onProgress?: (data: PdfProgressData) => void;
    onError?: () => void;
}

const PROGRESS_DEBOUNCE_MS = 2000;

/**
 * Renders a PDF's pages onto canvases within the page itself (rather than a native
 * <iframe> PDF plugin, which is an opaque nested browsing context JS cannot read).
 * This gives real current-page and scroll-percentage tracking for document-progress
 * reporting. Falls back via onError if the PDF can't be fetched or parsed (e.g. CORS
 * misconfiguration) so the caller can drop back to the iframe viewer.
 *
 * Renders every page up front — acceptable for typical policy-document lengths;
 * very large PDFs would benefit from virtualized/lazy page rendering.
 */
const PdfPageViewer: React.FC<PdfPageViewerProps> = ({ fileUrl, onProgress, onError }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const visiblePages = useRef<Map<number, number>>(new Map()); // page number -> intersection ratio
    const currentPageRef = useRef(1);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [numPages, setNumPages] = useState(0);

    const reportProgress = useCallback((immediate = false) => {
        const emit = () => {
            const container = containerRef.current;
            if (!container || !onProgress) return;
            const scrollable = container.scrollHeight - container.clientHeight;
            const scrollPercentage = scrollable > 0
                ? Math.min(100, Math.round((container.scrollTop / scrollable) * 100))
                : 100;
            onProgress({ page: currentPageRef.current, totalPages: numPages, scrollPercentage });
        };

        if (immediate) {
            emit();
            return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(emit, PROGRESS_DEBOUNCE_MS);
    }, [numPages, onProgress]);

    useEffect(() => {
        let cancelled = false;
        let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;

        const load = async () => {
            setIsLoading(true);
            setHasError(false);
            try {
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                if (cancelled) return;

                loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdfDoc: PDFDocumentProxy = await loadingTask.promise;
                if (cancelled) return;

                setNumPages(pdfDoc.numPages);

                const container = containerRef.current;
                if (!container) return;
                container.innerHTML = '';
                pageRefs.current.clear();

                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.3 });

                    const wrapper = document.createElement('div');
                    wrapper.dataset.pageNumber = String(pageNum);
                    wrapper.className = 'mx-auto mb-4 shadow-md';
                    wrapper.style.width = `${viewport.width}px`;

                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    wrapper.appendChild(canvas);
                    container.appendChild(wrapper);
                    pageRefs.current.set(pageNum, wrapper);

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
                    }
                    if (cancelled) return;
                }

                if (cancelled) return;
                setIsLoading(false);
            } catch (err) {
                console.error('PDF.js failed to load document:', err);
                if (!cancelled) {
                    setHasError(true);
                    setIsLoading(false);
                    onError?.();
                }
            }
        };

        load();

        return () => {
            cancelled = true;
            loadingTask?.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileUrl]);

    // Track which page is most visible via IntersectionObserver, and scroll % via a
    // plain scroll listener on the container.
    useEffect(() => {
        const container = containerRef.current;
        if (!container || isLoading || hasError) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const pageNum = Number((entry.target as HTMLElement).dataset.pageNumber);
                    if (!pageNum) continue;
                    if (entry.isIntersecting) {
                        visiblePages.current.set(pageNum, entry.intersectionRatio);
                    } else {
                        visiblePages.current.delete(pageNum);
                    }
                }
                let bestPage = currentPageRef.current;
                let bestRatio = 0;
                for (const [page, ratio] of visiblePages.current) {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestPage = page;
                    }
                }
                if (bestPage !== currentPageRef.current) {
                    currentPageRef.current = bestPage;
                }
                reportProgress();
            },
            { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        for (const el of pageRefs.current.values()) observer.observe(el);

        const handleScroll = () => reportProgress();
        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            container.removeEventListener('scroll', handleScroll);
        };
    }, [isLoading, hasError, numPages, reportProgress]);

    // Report final progress on unmount (e.g. viewer closed) so a quick glance still counts.
    useEffect(() => {
        return () => reportProgress(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (hasError) {
        return (
            <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 h-full">
                <div className="text-center p-8">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300">Couldn't load the PDF viewer.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
                    <div className="text-center">
                        <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">Loading PDF...</p>
                    </div>
                </div>
            )}
            <div ref={containerRef} className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-950 p-4" />
        </div>
    );
};

export default PdfPageViewer;
