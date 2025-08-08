import React, { type FC, useState, useEffect } from 'react';
import { X, Download, PenTool, FileText, ExternalLink, AlertCircle, Loader } from 'lucide-react';

interface DocumentType {
    id: number;
    name: string;
    category: string;
    categoryId: string;
    dateAdded: string;
    dueDate: string;
    status: 'pending' | 'signed' | 'viewed' | 'overdue';
    size: string;
    priority: 'high' | 'medium' | 'low';
    content: string;
    fileUrl: string;
    signedDate?: string;
}

interface DocumentViewerProps {
    document: DocumentType;
    onClose: () => void;
    onSign?: (doc: DocumentType) => void;
    onDownload?: (doc: DocumentType) => void;
}

const DocumentViewer: FC<DocumentViewerProps> = ({
    document,
    onClose,
    onSign,
    onDownload
}) => {
    const [viewerError, setViewerError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentViewer, setCurrentViewer] = useState<'office' | 'google' | 'direct' | 'unsupported'>('office');

    // Get file extension - improved detection for real URLs
    const getFileExtension = (filename: string): string => {
        // Remove query parameters and fragments from URL
        const cleanFilename = filename.split('?')[0].split('#')[0];

        // Extract extension from the last part of the URL path
        const pathParts = cleanFilename.split('/');
        const actualFilename = pathParts[pathParts.length - 1];

        // Split by dots and get the last part
        const parts = actualFilename.split('.');
        if (parts.length < 2) return '';

        const extension = parts.pop()?.toLowerCase() || '';

        // Validate the extension - must be letters only, 2-5 characters
        if (!/^[a-z]{2,5}$/.test(extension)) {
            return '';
        }

        // Handle common cases where extension might be malformed or validate known extensions
        const validExtensions = [
            'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
            'txt', 'md', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
            'odt', 'ods', 'odp', 'json', 'xml', 'log', 'svg'
        ];

        // If we got a valid extension, return it
        if (validExtensions.includes(extension)) {
            return extension;
        }

        // Try to detect from filename patterns or content inspection
        const lowerContent = cleanFilename.toLowerCase();
        if (lowerContent.includes('word') || lowerContent.includes('doc')) return 'docx';
        if (lowerContent.includes('powerpoint') || lowerContent.includes('ppt')) return 'pptx';
        if (lowerContent.includes('excel') || lowerContent.includes('xls')) return 'xlsx';
        if (lowerContent.includes('pdf')) return 'pdf';
        if (lowerContent.includes('csv')) return 'csv';

        // Return empty string for invalid extensions rather than the invalid extension
        return '';
    };

    // Get file type category - expanded support
    const getFileType = (extension: string): 'pdf' | 'office' | 'image' | 'text' | 'unsupported' => {
        switch (extension) {
            case 'pdf':
                return 'pdf';
            case 'doc':
            case 'docx':
            case 'ppt':
            case 'pptx':
            case 'xls':
            case 'xlsx':
            case 'odt':
            case 'ods':
            case 'odp':
                return 'office';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'webp':
            case 'svg':
                return 'image';
            case 'txt':
            case 'md':
            case 'csv':
            case 'json':
            case 'xml':
            case 'log':
                return 'text';
            default:
                return 'unsupported';
        }
    };

    // Try URL first (more reliable), then document name as fallback
    const fileExtension = getFileExtension(document.fileUrl) || getFileExtension(document.name);
    const fileType = getFileType(fileExtension);

    // Generate viewer URLs
    const getViewerUrls = (fileUrl: string) => {
        const encodedUrl = encodeURIComponent(fileUrl);
        return {
            office: `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`,
            google: `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`,
            direct: fileUrl
        };
    };

    const viewerUrls = getViewerUrls(document.fileUrl);

    // Handle iframe load events
    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setViewerError(true);
        // Try fallback viewers
        if (currentViewer === 'office') {
            setCurrentViewer('google');
            setViewerError(false);
            setIsLoading(true);
        } else if (currentViewer === 'google') {
            setCurrentViewer('direct');
            setViewerError(false);
            setIsLoading(true);
        }
    };

    const handleIframeScroll = (event: React.UIEvent<HTMLIFrameElement>) => {
        // Prevent scrolling in the viewer
        event.currentTarget.scrollTop = 0;
        event.currentTarget.scrollLeft = 0;

        // Prevent default scrolling behavior
        event.preventDefault();

        console.log('Scroll event prevented in iframe', event);
        // console.log('Scroll event prevented in iframe', event);
    };

    // Reset states when document changes
    useEffect(() => {
        setViewerError(false);
        setIsLoading(true);
        setCurrentViewer('office');
    }, [document.id]);

    // Get status configuration
    const getStatusConfig = (status: DocumentType['status']) => {
        switch (status) {
            case 'signed':
                return {
                    bgColor: 'bg-green-100 dark:bg-green-900/30',
                    textColor: 'text-green-800 dark:text-green-400',
                    label: 'Signed'
                };
            case 'pending':
                return {
                    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
                    textColor: 'text-yellow-800 dark:text-yellow-400',
                    label: 'Pending Signature'
                };
            case 'viewed':
                return {
                    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                    textColor: 'text-blue-800 dark:text-blue-400',
                    label: 'Viewed'
                };
            case 'overdue':
                return {
                    bgColor: 'bg-red-100 dark:bg-red-900/30',
                    textColor: 'text-red-800 dark:text-red-400',
                    label: 'Overdue'
                };
            default:
                return {
                    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
                    textColor: 'text-gray-800 dark:text-gray-400',
                    label: 'New'
                };
        }
    };

    const statusConfig = getStatusConfig(document.status);

    const handleDownload = () => {
        if (onDownload) {
            onDownload(document);
        } else {
            window.location.href = document.fileUrl;
            console.log(`Downloading ${document.name}...`);
        }
    };

    const handleSign = () => {
        if (onSign) {
            onSign(document);
        }
    };

    // Render document viewer based on file type
    const renderDocumentViewer = () => {
        // Handle unsupported files or when extension detection fails
        if (fileType === 'unsupported' || !fileExtension) {
            return (
                <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 h-full">
                    <div className="text-center p-8">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {!fileExtension ? 'Cannot determine file type' : 'File type not supported'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {!fileExtension
                                ? 'Unable to detect file extension from filename or URL'
                                : `Cannot preview .${fileExtension} files in the browser`
                            }
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download to view
                            </button>
                            <button
                                onClick={() => window.open(document.fileUrl, '_blank')}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Try in new tab
                            </button>
                        </div>
                        {/* Debug info - remove in production */}
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left">
                            <p><strong>Debug Info:</strong></p>
                            <p>Name: {document.name}</p>
                            <p>URL: {document.fileUrl}</p>
                            <p>Detected Extension: {fileExtension || 'none'}</p>
                            <p>File Type: {fileType}</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Handle images
        if (fileType === 'image') {
            return (
                <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 h-full">
                    <img
                        src={document.fileUrl}
                        alt={document.name}
                        className="max-w-full max-h-full object-contain"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                    />
                </div>
            );
        }

        // Handle text files
        if (fileType === 'text') {
            // Special handling for CSV files
            if (fileExtension === 'csv') {
                return (
                    <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 h-full">
                        <div className="text-center p-8">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                CSV files cannot be previewed
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Please download the file to view its contents in a spreadsheet application.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download CSV
                                </button>
                                <button
                                    onClick={() => window.open(document.fileUrl, '_blank')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Raw Data
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="bg-white dark:bg-gray-800 p-6 h-full">
                    <iframe
                        src={document.fileUrl}
                        className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        onScroll={handleIframeScroll}
                    />
                </div>
            );
        }

        // Handle PDF files
        if (fileType === 'pdf') {
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
                    <iframe
                        src={`${document.fileUrl}#view=FitH`}
                        className="w-full h-full border-0"
                        title={document.name}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                    />
                </div>
            );
        }

        // Handle Office files (DOC, DOCX, PPT, PPTX, XLS, XLSX)
        if (fileType === 'office') {
            let currentUrl = viewerUrls.office;
            if (currentViewer === 'google') {
                currentUrl = viewerUrls.google;
            } else if (currentViewer === 'direct') {
                currentUrl = viewerUrls.direct;
            }

            if (viewerError && currentViewer === 'direct') {
                return (
                    <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 h-full">
                        <div className="text-center p-8">
                            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Unable to preview document
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                The document could not be loaded in the viewer
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                                <button
                                    onClick={() => window.open(document.fileUrl, '_blank')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open in new tab
                                </button>
                            </div>
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
                                <p className="text-gray-500 dark:text-gray-400">
                                    Loading {fileExtension.toUpperCase()} document...
                                </p>
                                {currentViewer === 'google' && (
                                    <p className="text-xs text-gray-400 mt-1">Using Google Docs viewer</p>
                                )}
                            </div>
                        </div>
                    )}
                    <iframe
                        src={currentUrl}
                        className="w-full h-full border-0"
                        title={document.name}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {document.name}
                            </h2>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>Added on {document.dateAdded}</span>
                                <span>•</span>
                                <span>Due: {document.dueDate}</span>
                                <span>•</span>
                                <span>{document.size}</span>
                                <span>•</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                    {statusConfig.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Action Buttons */}
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                            title="Download Document"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>

                        {(document.status === 'pending' || document.status === 'viewed' || document.status === 'overdue') && (
                            <button
                                onClick={handleSign}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                title="Sign Document"
                            >
                                <PenTool className="w-4 h-4" />
                                Sign
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Document Viewer - Full remaining height */}
                <div className="flex-1 min-h-0">
                    {renderDocumentViewer()}
                </div>

                {/* Footer with document info */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                            <span>Category: {document.category}</span>
                            <span>•</span>
                            <span className="uppercase">{fileExtension || 'unknown'} file</span>
                            <span>•</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${document.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                                document.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                                    'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                }`}>
                                {document.priority} priority
                            </span>
                            {document.signedDate && (
                                <>
                                    <span>•</span>
                                    <span className="text-green-600 dark:text-green-400">
                                        Signed on {document.signedDate}
                                    </span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => window.open(document.fileUrl, '_blank')}
                            className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open in new tab
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;