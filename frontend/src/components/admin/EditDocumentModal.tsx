import React, { useState, useEffect } from 'react';
import { X, FileText, UploadCloud, Save, Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FolderType {
    id: number;
    name: string;
    departmentId?: number;
    color: string;
    department?: string;
    fileCount?: number;
    size?: string;
    icon?: React.ElementType;
    description?: string;
}

interface DocumentType {
    id: number;
    name: string;
    uploadedByDisplay: string;
    uploadedById: string;
    department: string;
    avatar: string;
    date: string;
    status: 'active' | 'draft' | 'archived';
    signatureRate: number;
    folder: string;
    category: string;
    size: string;
    fileUrl: string;
    priority?: string;
    mimeType?: string;
    fileBase64?: string | null;
}

interface EditDocumentState {
    name: string;
    folder: string;
    expiryFrequency: string;
    file?: File | null;
    url?: string | null;
    status: 'active' | 'draft' | 'archived';
    keepExistingFile: boolean;
}

interface EditDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (documentId: number, documentData: EditDocumentState) => void;
    folders: FolderType[];
    document: DocumentType | null;
    isLoading?: boolean;
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    folders,
    document,
    isLoading = false
}) => {
    const [documentData, setDocumentData] = useState<EditDocumentState>({
        name: '',
        folder: '',
        expiryFrequency: '',
        file: null,
        url: null,
        status: 'draft',
        keepExistingFile: true
    });
    const [activeTab, setActiveTab] = useState<"file" | "url" | "keep">("keep");
    const [isDragging, setIsDragging] = useState(false);

    // Populate form when document changes
    useEffect(() => {
        if (document && isOpen) {
            const folderObj = folders.find(f => f.name === document.folder);
            const isExternalLink = document.size === 'External Link' || document.fileUrl.startsWith('http');

            setDocumentData({
                name: document.name,
                folder: folderObj?.id.toString() || '',
                expiryFrequency: '', // You might want to store this in the document object
                file: null,
                url: isExternalLink ? document.fileUrl : null,
                status: document.status,
                keepExistingFile: true
            });

            setActiveTab(isExternalLink ? "url" : "keep");
        }
    }, [document, folders, isOpen]);

    const handleSubmit = () => {
        if (document) {
            onSubmit(document.id, documentData);
        }
    };

    const handleClose = () => {
        setDocumentData({
            name: '',
            folder: '',
            expiryFrequency: '',
            file: null,
            url: null,
            status: 'draft',
            keepExistingFile: true
        });
        setActiveTab("keep");
        setIsDragging(false);
        onClose();
    };

    const handleTabChange = (tab: "file" | "url" | "keep") => {
        setActiveTab(tab);
        if (tab === "file") {
            setDocumentData(prev => ({ ...prev, url: null, keepExistingFile: false }));
        } else if (tab === "url") {
            setDocumentData(prev => ({ ...prev, file: null, keepExistingFile: false }));
        } else if (tab === "keep") {
            setDocumentData(prev => ({ ...prev, file: null, url: null, keepExistingFile: true }));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setDocumentData(prev => ({
                ...prev,
                file: e.dataTransfer.files[0],
                url: null,
                keepExistingFile: false
            }));
            e.dataTransfer.clearData();
        }
    };

    const isExternalLink = document && (document.size === 'External Link' || document.fileUrl.startsWith('http'));

    if (!isOpen || !document) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Edit Document</h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div>
                        <Label htmlFor="edit-doc-name" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Document Name *
                        </Label>
                        <Input
                            id="edit-doc-name"
                            type="text"
                            value={documentData.name}
                            onChange={(e) => setDocumentData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                            placeholder="Enter document name"
                        />
                    </div>

                    <div>
                        <Label htmlFor="edit-doc-folder" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Folder *
                        </Label>
                        <Select
                            disabled
                            value={documentData.folder}
                            onValueChange={(value) => setDocumentData(prev => ({ ...prev, folder: value }))}
                        >
                            <SelectTrigger id='edit-doc-folder' className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
                                <SelectValue placeholder="Select a folder" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                {folders.map((folder) => (
                                    <SelectItem
                                        className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                        key={folder.id}
                                        value={folder.id.toString()}
                                    >
                                        {folder.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="edit-doc-status" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Status
                        </Label>
                        <Select
                            value={documentData.status}
                            onValueChange={(value: 'active' | 'draft' | 'archived') => setDocumentData(prev => ({ ...prev, status: value }))}
                        >
                            <SelectTrigger id='edit-doc-status' className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                <SelectItem value="active" className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800">
                                    Active
                                </SelectItem>
                                <SelectItem value="draft" className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800">
                                    Draft
                                </SelectItem>
                                <SelectItem value="archived" className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800">
                                    Archived
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* File/URL Management Tabs */}
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => handleTabChange("keep")}
                            className={`px-4 py-2 font-medium ${activeTab === "keep"
                                ? "border-b-2 border-emerald-500 text-emerald-600"
                                : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            Keep Current {isExternalLink ? 'URL' : 'File'}
                        </button>
                        <button
                            onClick={() => handleTabChange("file")}
                            className={`px-4 py-2 font-medium ${activeTab === "file"
                                ? "border-b-2 border-emerald-500 text-emerald-600"
                                : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            Replace with File
                        </button>
                        <button
                            onClick={() => handleTabChange("url")}
                            className={`px-4 py-2 font-medium ${activeTab === "url"
                                ? "border-b-2 border-emerald-500 text-emerald-600"
                                : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            Replace with URL
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "keep" && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">
                                        Current {isExternalLink ? 'URL' : 'File'}: {document.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Size: {document.size}
                                    </p>
                                    {isExternalLink && (
                                        <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                                            {document.fileUrl}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "file" && (
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${isDragging
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                } hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20`}
                            onClick={() => window.document.getElementById("edit-doc-file")?.click()}
                        >
                            <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                                {documentData.file
                                    ? `Selected: ${documentData.file.name}`
                                    : "Drag & drop your new file here, or click to browse"}
                            </p>
                            <input
                                id="edit-doc-file"
                                type="file"
                                onChange={(e) =>
                                    setDocumentData(prev => ({
                                        ...prev,
                                        file: e.target.files ? e.target.files[0] : null,
                                        keepExistingFile: false
                                    }))
                                }
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            />
                        </div>
                    )}

                    {activeTab === "url" && (
                        <div>
                            <Label htmlFor="edit-doc-url" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Document URL
                            </Label>
                            <Input
                                id="edit-doc-url"
                                type="text"
                                value={documentData.url || ""}
                                onChange={(e) =>
                                    setDocumentData(prev => ({
                                        ...prev,
                                        url: e.target.value,
                                        file: null,
                                        keepExistingFile: false
                                    }))
                                }
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                                placeholder="Enter document URL"
                            />
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                Enter a new URL to replace the current document.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!documentData.name || !documentData.folder || isLoading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Update Document
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditDocumentModal;