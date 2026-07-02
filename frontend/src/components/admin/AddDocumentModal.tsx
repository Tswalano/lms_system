import React, { useState } from 'react';
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

interface NewDocumentState {
    name: string;
    folder: string;
    expiryDate: string;
    renewalFrequencyDays: string;
    file?: File | null;
    url?: string | null;
    status: 'active' | 'draft' | 'archived';
}

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (documentData: NewDocumentState) => void;
    folders: FolderType[];
    isLoading?: boolean;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    folders,
    isLoading = false
}) => {
    const [documentData, setDocumentData] = useState<NewDocumentState>({
        name: '',
        folder: '',
        expiryDate: '',
        renewalFrequencyDays: '',
        file: null,
        url: null,
        status: 'draft'
    });
    const [activeTab, setActiveTab] = useState<"file" | "url">("file");
    const [isDragging, setIsDragging] = useState(false);

    const handleSubmit = () => {
        onSubmit(documentData);
    };

    const handleClose = () => {
        setDocumentData({
            name: '',
            folder: '',
            expiryDate: '',
            renewalFrequencyDays: '',
            file: null,
            url: null,
            status: 'draft'
        });
        setActiveTab("file");
        setIsDragging(false);
        onClose();
    };

    const handleTabChange = (tab: "file" | "url") => {
        setActiveTab(tab);
        if (tab === "file") {
            setDocumentData(prev => ({ ...prev, url: null }));
        } else {
            setDocumentData(prev => ({ ...prev, file: null }));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setDocumentData(prev => ({ ...prev, file: e.dataTransfer.files[0], url: null }));
            e.dataTransfer.clearData();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add New Document</h3>
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
                        <Label htmlFor="doc-name" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Document Name *
                        </Label>
                        <Input
                            id="doc-name"
                            type="text"
                            value={documentData.name}
                            onChange={(e) => setDocumentData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                            placeholder="Enter document name"
                        />
                    </div>

                    <div>
                        <Label htmlFor="doc-folder" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Folder *
                        </Label>
                        <Select
                            value={documentData.folder}
                            onValueChange={(value) => setDocumentData(prev => ({ ...prev, folder: value }))}
                        >
                            <SelectTrigger id='doc-folder' className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="doc-expiry" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Expiry Date (optional)
                            </Label>
                            <Input
                                id="doc-expiry"
                                type="date"
                                value={documentData.expiryDate}
                                onChange={(e) => setDocumentData(prev => ({ ...prev, expiryDate: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <Label htmlFor="doc-renewal" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Renewal Frequency (days)
                            </Label>
                            <Input
                                id="doc-renewal"
                                type="number"
                                min={1}
                                value={documentData.renewalFrequencyDays}
                                onChange={(e) => setDocumentData(prev => ({ ...prev, renewalFrequencyDays: e.target.value }))}
                                placeholder="e.g. 365"
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => handleTabChange("file")}
                            className={`px-4 py-2 font-medium ${activeTab === "file"
                                ? "border-b-2 border-cyan-500 text-cyan-600"
                                : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            Upload File
                        </button>
                        <button
                            onClick={() => handleTabChange("url")}
                            className={`px-4 py-2 font-medium ${activeTab === "url"
                                ? "border-b-2 border-cyan-500 text-cyan-600"
                                : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            Paste URL
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "file" && (
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${isDragging
                                ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                } hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20`}
                            onClick={() => document.getElementById("doc-file")?.click()}
                        >
                            <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                                {documentData.file
                                    ? `Selected: ${documentData.file.name}`
                                    : "Drag & drop your file here, or click to browse"}
                            </p>
                            <input
                                id="doc-file"
                                type="file"
                                onChange={(e) =>
                                    setDocumentData(prev => ({
                                        ...prev,
                                        file: e.target.files ? e.target.files[0] : null,
                                    }))
                                }
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            />
                        </div>
                    )}

                    {activeTab === "url" && (
                        <div>
                            <Label htmlFor="doc-url" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Document URL
                            </Label>
                            <Input
                                id="doc-url"
                                type="text"
                                value={documentData.url || ""}
                                onChange={(e) =>
                                    setDocumentData(prev => ({ ...prev, url: e.target.value, file: null }))
                                }
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                                placeholder="Enter document URL"
                            />
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                If you provide a URL, you don't need to upload a file.
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
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Add Document
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddDocumentModal;