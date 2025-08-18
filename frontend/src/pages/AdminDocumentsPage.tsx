/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, type FC } from 'react';
import {
    Plus,
    Folder,
    FileText,
    Download,
    Eye,
    Edit3,
    Trash2,
    FileBadge,
    X,
    FolderPlus,
    Save,
    UploadCloud,
    Loader2,
    AlertCircle,
    UserPlus,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User } from "../contexts/AuthContext";
import { createAvatar } from '@/lib/helper';
import DocumentViewModal from '@/components/DocumentViewModal';

// Interface for API Document
interface ApiDocument {
    id: number;
    name: string;
    file_url: string;
    file_size: string;
    priority: string;
    createdAt: string;
    uploadedById: string;
    uploadedByDisplay: string;
    signatures: {
        signed: number;
        totalAssigned: number;
        percentage: number;
    };
}

// Interface for API Category
interface ApiCategory {
    departmentId: null;
    id: string;
    name: string;
    description: string;
    color: string;
    documents: ApiDocument[];
}

// Interface for Department
interface Department {
    id: number;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Interface for API Responses
interface DocumentCategoriesResponse {
    code: string;
    message: string;
    error: boolean;
    payload: ApiCategory[];
}

interface DepartmentsResponse {
    code: string;
    message: string;
    error: boolean;
    payload: Department[];
}

// Interface for a Folder object (transformed from API)
interface FolderType {
    id?: string;
    name: string;
    fileCount: number;
    size: string;
    color: string;
    icon: React.ElementType;
    description?: string;
    departmentId: number | null;
}

// Interface for a Document object (transformed from API)
interface DocumentType {
    id: number;
    name: string;
    uploadedByDisplay: string;
    uploadedById: string;
    avatar: string;
    date: string;
    status: 'active' | 'draft' | 'archived';
    signatureRate: number;
    folder: string;
    size: string;
    fileUrl: string;
    priority?: string;
    mimeType?: string;
    fileBase64?: string | null;
}

// Interface for the new document state
interface NewDocumentState {
    name: string;
    folder: string;
    expiryFrequency: string;
    file?: File | null;
    url?: string | null;
    status: 'active' | 'draft' | 'archived';
}

// Interface for the new folder state
interface NewFolderState {
    name: string;
    departmentId: number | null;
    color: string;
}

// Interface for the edit document state
interface EditDocumentState {
    id: number | null;
    name: string;
    folder: string;
    status: 'active' | 'draft' | 'archived';
}

const AdminDocumentsPage: FC = () => {
    const { authFetch, user } = useAuth();
    const queryClient = useQueryClient();

    // Component state
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showAddDocumentModal, setShowAddDocumentModal] = useState<boolean>(false);
    const [showAddFolderModal, setShowAddFolderModal] = useState<boolean>(false);
    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState<"file" | "url">("file");

    // Local state for folders and documents
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [allDocuments, setAllDocuments] = useState<DocumentType[]>([]);

    // Form states
    const [newDocument, setNewDocument] = useState<NewDocumentState>({
        name: '',
        folder: '',
        expiryFrequency: '',
        file: null,
        url: null,
        status: 'draft'
    });

    const [newFolder, setNewFolder] = useState<NewFolderState>({
        name: '',
        departmentId: 1,
        color: 'bg-blue-500'
    });

    const [editDocument, setEditDocument] = useState<EditDocumentState>({
        id: null,
        name: '',
        folder: '',
        status: 'draft'
    });

    // Constants
    const renewalFrequencies = [
        { id: 1, name: 'Weekly' },
        { id: 2, name: 'Monthly' },
        { id: 3, name: 'Quarterly' },
        { id: 4, name: 'Bi-Annually' },
        { id: 6, name: 'Never', className: 'text-gray-400 dark:text-gray-500' }
    ];

    const folderColors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-orange-500',
        'bg-red-500',
        'bg-indigo-500'
    ];

    // URL validation function
    const isValidUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    };

    // API Functions
    const fetchDepartments = async (): Promise<Department[]> => {
        try {
            const response = await authFetch('/users/departments', {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch departments');
            }

            const result: DepartmentsResponse = await response.json();

            if (result.error || result.code !== 'SUCCESS') {
                throw new Error(result.message || 'Failed to fetch departments');
            }

            return result.payload;
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    };

    const fetchDocumentCategories = async (): Promise<{ folders: FolderType[], documents: DocumentType[] }> => {
        try {
            const response = await authFetch('/admin-docs/by-category', {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch document categories');
            }

            const result: DocumentCategoriesResponse = await response.json();

            if (result.error || result.code !== 'SUCCESS') {
                throw new Error(result.message || 'Failed to fetch document categories');
            }

            return transformApiData(result.payload);
        } catch (error) {
            console.error('Error fetching document categories:', error);
            throw error;
        }
    };

    // React Query hooks
    const {
        data: departments = [],
        isLoading: departmentsLoading,
        error: departmentsError
    } = useQuery({
        queryKey: ['departments'],
        queryFn: fetchDepartments,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    const {
        data: documentsData,
        isLoading: documentsLoading,
        error: documentsError,
        refetch: refetchDocuments
    } = useQuery({
        queryKey: ['documentsCategories'],
        queryFn: fetchDocumentCategories,
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 2,
    });

    // Update local state when data changes
    useEffect(() => {
        if (documentsData) {
            setFolders(documentsData.folders);
            setAllDocuments(documentsData.documents);
        }
    }, [documentsData]);

    // Mutations
    const createFolderMutation = useMutation({
        mutationFn: async (folderData: NewFolderState) => {
            const response = await authFetch('/admin-docs/categories', {
                method: 'PUT',
                body: JSON.stringify({
                    name: folderData.name,
                    fileCount: 0,
                    size: '0 MB',
                    color: folderData.color,
                    departmentId: folderData.departmentId || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            return response.json();
        },
        onSuccess: (responsePayload) => {
            const newCategory = responsePayload.payload;
            const folder: FolderType = {
                id: newCategory.id,
                name: newFolder.name,
                fileCount: 0,
                size: '0 MB',
                color: newFolder.color,
                icon: Folder,
                departmentId: newFolder.departmentId || null
            };

            setFolders(prev => [...prev, folder]);
            setNewFolder({ name: '', departmentId: null, color: 'bg-blue-500' });
            setShowAddFolderModal(false);

            toast.success("Folder created successfully!", {
                description: `Folder "${folder.name}" has been created.`,
            });
        },
        onError: (error: Error) => {
            toast.error("Error creating folder", {
                description: error.message || "Failed to create folder. Please try again.",
            });
        }
    });

    const createDocumentMutation = useMutation({
        mutationFn: async (documentPayload: any) => {
            const response = await authFetch('/admin-docs', {
                method: 'POST',
                body: JSON.stringify(documentPayload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            return response.json();
        },
        onSuccess: (responsePayload, documentPayload) => {
            const document: DocumentType = {
                id: responsePayload.payload.id,
                name: documentPayload.name,
                uploadedByDisplay: documentPayload.uploadedByDisplay,
                uploadedById: documentPayload.uploadedById,
                avatar: createAvatar(documentPayload.uploadedByDisplay.split(' ')[0], documentPayload.uploadedByDisplay.split(' ')[1]),
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                status: documentPayload.status || 'draft',
                signatureRate: documentPayload.signatures ? documentPayload.signatures.percentage : 0,
                folder: documentPayload.folder,
                size: documentPayload.size,
                // content: documentPayload.content,
                fileUrl: documentPayload.fileUrl || documentPayload.finalUrl || "",
            };

            setAllDocuments(prev => [document, ...prev]);
            setFolders(prev => prev.map(folder =>
                folder.id === newDocument.folder
                    ? { ...folder, fileCount: folder.fileCount + 1 }
                    : folder
            ));

            setNewDocument({ name: '', folder: '', file: null, url: null, status: 'draft', expiryFrequency: '' });
            setShowAddDocumentModal(false);

            toast.success("Document added successfully!", {
                description: `Document "${document.name}" has been added.`,
            });
        },
        onError: (error: Error) => {
            toast.error("Error adding document", {
                description: error.message || "Failed to add document. Please try again.",
            });
        }
    });

    // Helper functions
    const calculateTotalSize = (documents: ApiDocument[]): string => {
        const totalBytes = documents.reduce((total, doc) => {
            const sizeStr = doc?.file_size ? doc.file_size.toLowerCase() : "0 KB";
            let bytes = 0;

            if (sizeStr.includes('kb')) {
                bytes = parseFloat(sizeStr) * 1024;
            } else if (sizeStr.includes('mb')) {
                bytes = parseFloat(sizeStr) * 1024 * 1024;
            } else if (sizeStr.includes('gb')) {
                bytes = parseFloat(sizeStr) * 1024 * 1024 * 1024;
            }

            return total + bytes;
        }, 0);

        if (totalBytes < 1024 * 1024) {
            return `${(totalBytes / 1024).toFixed(1)} KB`;
        } else if (totalBytes < 1024 * 1024 * 1024) {
            return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
        } else {
            return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        }
    };

    const transformApiData = (apiData: ApiCategory[]) => {
        const transformedFolders: FolderType[] = [];
        const transformedDocuments: DocumentType[] = [];

        apiData.forEach(category => {
            transformedFolders.push({
                id: category.id,
                name: category.name,
                fileCount: category.documents.length,
                size: calculateTotalSize(category.documents),
                color: category.color,
                icon: Folder,
                description: category.description,
                departmentId: category.departmentId || null
            });

            const actualCategoryDocuments = category.documents.filter(dc => !!dc.id);

            actualCategoryDocuments.forEach(doc => {
                transformedDocuments.push({
                    id: doc.id,
                    name: doc.name,
                    uploadedByDisplay: doc.uploadedByDisplay,
                    uploadedById: doc.uploadedById,
                    avatar: createAvatar(doc.uploadedByDisplay.split(' ')[0], doc.uploadedByDisplay.split(' ')[1]),
                    date: new Date(doc.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }),
                    status: 'active',
                    signatureRate: doc.signatures ? doc.signatures.percentage : 0,
                    folder: category.id,
                    size: doc.file_size,
                    fileUrl: doc.file_url,
                    priority: doc.priority
                });
            });
        });

        return { folders: transformedFolders, documents: transformedDocuments };
    };

    const getStatusColor = (status: 'active' | 'draft' | 'archived'): string => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDocumentBase64 = async (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    };

    // Event handlers
    const handleFolderClick = (folderId: string): void => {
        setSelectedFolder(selectedFolder === folderId ? null : folderId);
    };

    const handleAddFolder = (): void => {
        if (!newFolder.name.trim()) {
            toast.error("Validation Error", {
                description: "Folder name is required.",
            });
            return;
        }
        createFolderMutation.mutate(newFolder);
    };

    const handleAddDocument = async (): Promise<void> => {
        // Validation
        if (!newDocument.name.trim() || !newDocument.folder) {
            toast.error("Validation Error", {
                description: "Document name and folder are required.",
            });
            return;
        }

        // Check if both file and URL are provided or both are missing
        const hasFile = !!newDocument.file;
        const hasUrl = !!newDocument.url?.trim();

        if (!hasFile && !hasUrl) {
            toast.error("Validation Error", {
                description: "Please either upload a file or provide a URL.",
            });
            return;
        }

        if (hasFile && hasUrl) {
            toast.error("Validation Error", {
                description: "Please provide either a file or a URL, not both.",
            });
            return;
        }

        // Validate URL format if URL is provided
        if (hasUrl && !isValidUrl(newDocument.url!)) {
            toast.error("Validation Error", {
                description: "Please enter a valid URL (must start with http:// or https://).",
            });
            return;
        }

        try {
            const documentPayload: any = {
                name: newDocument.name,
                uploadedById: (user as User).id,
                uploadedByDisplay: `${(user as User).firstName} ${(user as User).lastName}`,
                departmentId: null, // Adjust as needed
                folder: newDocument.folder,
                content: hasUrl
                    ? `This document is linked to: ${newDocument.url}`
                    : 'Document content will be processed and displayed here once uploaded.',
                status: newDocument.status,
            };

            if (hasUrl) {
                // URL-based document
                documentPayload.fileUrl = newDocument.url;
                documentPayload.size = 'External Link';
                documentPayload.mimeType = 'text/html'; // Default for URLs
                documentPayload.fileBase64 = null;
            } else if (hasFile) {
                // File-based document
                const fileBase64 = await getDocumentBase64(newDocument.file!);
                documentPayload.size = `${Math.round(newDocument.file!.size / 1024)} KB`;
                documentPayload.mimeType = newDocument.file!.type || 'application/octet-stream';
                documentPayload.fileBase64 = fileBase64 ? fileBase64.split(",")[1] : null;
                documentPayload.fileUrl = null;
            }

            createDocumentMutation.mutate(documentPayload);
        } catch (error) {
            console.error('Error processing document:', error);
            toast.error("Error processing document", {
                description: "Failed to process the document. Please try again.",
            });
        }
    };

    const handleViewDocument = (doc: DocumentType): void => {
        setSelectedDocument(doc);
        setShowViewModal(true);
    };

    const handleDownloadDocument = (doc: DocumentType): void => {
        if (isValidUrl(doc.fileUrl)) {
            // If it's a URL, open in new tab
            window.open(doc.fileUrl, '_blank');
        } else {
            // If it's a direct file, download it
            const link = document.createElement('a');
            link.href = doc.fileUrl;
            link.download = doc.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleEditDocument = (doc: DocumentType): void => {
        setEditDocument({
            id: doc.id,
            name: doc.name,
            folder: doc.folder,
            status: doc.status
        });
        setShowEditModal(true);
    };

    const handleUpdateDocument = (): void => {
        if (!editDocument.name.trim() || !editDocument.folder || editDocument.id === null) {
            toast.error("Validation Error", {
                description: "Document name, folder, and ID are required for update.",
            });
            return;
        }

        const oldDocument = allDocuments.find(doc => doc.id === editDocument.id);
        const oldFolderId = oldDocument?.folder;
        const newFolderId = editDocument.folder;

        setAllDocuments(prev => prev.map(doc =>
            doc.id === editDocument.id
                ? { ...doc, name: editDocument.name, folder: editDocument.folder, status: editDocument.status }
                : doc
        ));

        if (oldFolderId !== newFolderId) {
            setFolders(prev => prev.map(folder => {
                if (folder.id === oldFolderId) {
                    return { ...folder, fileCount: Math.max(0, folder.fileCount - 1) };
                }
                if (folder.id === newFolderId) {
                    return { ...folder, fileCount: folder.fileCount + 1 };
                }
                return folder;
            }));
        }

        setShowEditModal(false);
        setEditDocument({ id: null, name: '', folder: '', status: 'draft' });

        toast.success("Document updated successfully!", {
            description: `Document "${editDocument.name}" has been updated.`,
        });
    };

    const handleDeleteDocument = (docId: number): void => {
        if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            const documentToDelete = allDocuments.find(doc => doc.id === docId);

            setAllDocuments(prev => prev.filter(doc => doc.id !== docId));

            if (documentToDelete) {
                setFolders(prev => prev.map(folder =>
                    folder.id === documentToDelete.folder
                        ? { ...folder, fileCount: Math.max(0, folder.fileCount - 1) }
                        : folder
                ));
            }

            toast.success("Document deleted", {
                description: "Document has been removed successfully.",
            });
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setNewDocument({ ...newDocument, file: e.dataTransfer.files[0], url: null });
            e.dataTransfer.clearData();
        }
    };

    const handleFolderDepartmentChange = React.useCallback((value: string) => {
        setNewFolder(prev => ({ ...prev, departmentId: value === "none" ? null : parseInt(value) }));
    }, []);

    const handleFolderColorChange = React.useCallback((color: string) => {
        setNewFolder(prev => ({ ...prev, color }));
    }, []);

    const handleCloseAddFolderModal = React.useCallback(() => {
        setShowAddFolderModal(false);
    }, []);

    const handleFolderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewFolder({ ...newFolder, name: e.target.value });
    };

    // Handle tab switching and clear opposite input
    const handleTabChange = (tab: "file" | "url") => {
        setActiveTab(tab);
        if (tab === "file") {
            setNewDocument(prev => ({ ...prev, url: null }));
        } else {
            setNewDocument(prev => ({ ...prev, file: null }));
        }
    };

    // Computed values
    const filteredDocuments: DocumentType[] = selectedFolder
        ? allDocuments.filter(doc => doc.folder === selectedFolder)
        : allDocuments;

    const isLoading = documentsLoading || departmentsLoading;
    const hasError = documentsError || departmentsError;

    return (
        <div className="font-inter">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <FileBadge className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Documents</h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Manage company documents and track employee signatures
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setShowAddFolderModal(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <FolderPlus className="w-4 h-4" />
                            New Folder
                        </button>

                        <button
                            onClick={() => setShowAddDocumentModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <Plus className="w-4 h-4" />
                            New Document
                        </button>
                    </div>
                </div>
            </div>

            <div>
                {/* Loading and Error States */}
                {isLoading ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Loading documents and departments...</p>
                        </div>
                    </div>
                ) : hasError ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12">
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading data</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {(documentsError || departmentsError) instanceof Error
                                    ? (documentsError || departmentsError)?.message
                                    : 'Something went wrong'}
                            </p>
                            <Button
                                onClick={() => {
                                    refetchDocuments();
                                    queryClient.invalidateQueries({ queryKey: ['departments'] });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Folders Section */}
                        {folders.length > 0 ? (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Folders</h2>
                                    {selectedFolder && (
                                        <button
                                            onClick={() => setSelectedFolder(null)}
                                            className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
                                        >
                                            Show All Documents
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {folders.map((folder: FolderType) => (
                                        <div
                                            key={folder.id}
                                            onClick={() => handleFolderClick(folder?.id || "")}
                                            className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group ${selectedFolder === folder.id
                                                ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                                                : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-10 h-10 ${folder.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                    <folder.icon className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                                        {folder.name}
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                                <span>{folder.fileCount} Files</span>
                                                <span>{folder.size}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>) : (
                            // No folders available with a button t create a new folder
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                                <div className="mb-4">
                                    <FolderPlus className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No Folders Available</h2>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Create a new folder to organize your documents.
                                    </p>
                                    <Button
                                        onClick={() => setShowAddFolderModal(true)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                        <FolderPlus className="w-4 h-4 mr-2" />
                                        New Folder
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Documents Table */}
                        {allDocuments.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedFolder
                                            ? `${folders.find(f => f.id === selectedFolder)?.name || 'Selected Folder'} Files`
                                            : 'All Files'
                                        }
                                    </h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Upload By
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Signatures
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredDocuments.map((doc) => (
                                                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 rounded-lg flex items-center justify-center">
                                                                <FileText className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">{doc.date} • {doc.size}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 rounded-full flex items-center justify-center">
                                                                <span className="text-xs font-semibold text-white">{doc.avatar}</span>
                                                            </div>
                                                            <span className="text-sm text-gray-900 dark:text-white">{doc.uploadedByDisplay}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                                                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                <div
                                                                    className="bg-cyan-500 h-full rounded-full"
                                                                    style={{ width: `${doc.signatureRate}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm text-gray-900 dark:text-white">{doc.signatureRate}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewDocument(doc)}
                                                                className="text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                                                                title="View Document"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditDocument(doc)}
                                                                className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                title="Edit Document"
                                                            >
                                                                <Edit3 className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownloadDocument(doc)}
                                                                className="text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                                                title="Download Document"
                                                            >
                                                                <Download className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDocument(doc.id)}
                                                                className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                                title="Delete Document"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add Document Modal */}
            {showAddDocumentModal && (
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
                                    onClick={() => setShowAddDocumentModal(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div>
                                <Label htmlFor="new-doc-name" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Document Name *
                                </Label>
                                <Input
                                    id="new-doc-name"
                                    type="text"
                                    value={newDocument.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDocument({ ...newDocument, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                                    placeholder="Enter document name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="renewal-frequency" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Renewal Frequency
                                </Label>
                                <Select
                                    value={newDocument.expiryFrequency}
                                    onValueChange={(value: string) => setNewDocument({ ...newDocument, expiryFrequency: value })}
                                >
                                    <SelectTrigger id='renewal-frequency' className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
                                        <SelectValue placeholder="Select renewal frequency" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        {renewalFrequencies.map((renewal) => (
                                            <SelectItem
                                                className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                                key={renewal.id}
                                                value={renewal.name}
                                            >
                                                {renewal.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="new-doc-folder" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Folder *
                                </Label>
                                <Select
                                    value={newDocument.folder}
                                    onValueChange={(value: string) => setNewDocument({ ...newDocument, folder: value })}
                                >
                                    <SelectTrigger id='new-doc-folder' className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
                                        <SelectValue placeholder="Select a folder" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        {folders.map((folder) => (
                                            <SelectItem
                                                className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                                key={folder.id}
                                                value={folder.id as string}
                                            >
                                                {folder.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                    className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
                                    ${isDragging
                                            ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                        }
                                    hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20`}
                                    onClick={() => document.getElementById("new-doc-file")?.click()}
                                >
                                    <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                                    <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                                        {newDocument.file
                                            ? `Selected: ${newDocument.file.name}`
                                            : "Drag & drop your file here, or click to browse"}
                                    </p>
                                    <input
                                        id="new-doc-file"
                                        type="file"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setNewDocument({
                                                ...newDocument,
                                                file: e.target.files ? e.target.files[0] : null,
                                            })
                                        }
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                    />
                                </div>
                            )}

                            {activeTab === "url" && (
                                <div>
                                    <Label htmlFor="new-doc-url" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        Document URL
                                    </Label>
                                    <Input
                                        id="new-doc-url"
                                        type="text"
                                        value={newDocument.url || ""}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setNewDocument({ ...newDocument, url: e.target.value, file: null })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                                        placeholder="Enter document URL"
                                    />
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                        If you provide a URL, you don’t need to upload a file.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddDocumentModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddDocument}
                                    disabled={!newDocument.name || !newDocument.folder || createDocumentMutation.isPending}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium flex items-center justify-center"
                                >
                                    {createDocumentMutation.isPending ? (
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
            )}

            {/* Add Folder Modal */}
            {showAddFolderModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">

                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                        <UserPlus className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add New Folder</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={handleCloseAddFolderModal}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="p-6 space-y-4">

                            <div className="space-y-2">
                                <Label htmlFor="new-folder-name" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Folder Name *
                                </Label>
                                <Input
                                    id="new-folder-name"
                                    type="text"
                                    placeholder="Enter folder name"
                                    value={newFolder.name}
                                    onChange={handleFolderNameChange}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="addDepartment" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Department
                                </Label>
                                <Select
                                    value={newFolder.departmentId?.toString() || 'none'}
                                    onValueChange={handleFolderDepartmentChange}
                                >
                                    <SelectTrigger id="addDepartment" className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        <SelectItem
                                            className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                            value="none"
                                        >
                                            No Department
                                        </SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem
                                                className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                                key={department.id}
                                                value={department.id.toString()}
                                            >
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Folder Color
                                </Label>
                                <div className="flex gap-2 flex-wrap">
                                    {folderColors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleFolderColorChange(color)}
                                            className={`w-10 h-10 rounded-lg ${color} ${newFolder.color === color ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-800' : ''} hover:scale-110 transition-transform`}
                                            title={color.replace('bg-', '').replace('-', ' ')}
                                        />
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCloseAddFolderModal}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddFolder}
                                    disabled={!newFolder.name.trim() || createFolderMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {createFolderMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Add Folder'
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}


            {/* View Document Modal */}
            <DocumentViewModal
                showViewModal={showViewModal}
                setShowViewModal={setShowViewModal}
                selectedDocument={selectedDocument}
            />

            {/* Edit Document Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">

                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                        <Save className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Edit Document</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="p-6 space-y-4">

                            <div className="space-y-2">
                                <Label htmlFor="edit-doc-name" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Document Name *
                                </Label>
                                <Input
                                    id="edit-doc-name"
                                    type="text"
                                    placeholder="Enter document name"
                                    value={editDocument.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setEditDocument({ ...editDocument, name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-doc-folder" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Folder *
                                </Label>
                                <Select
                                    value={editDocument.folder}
                                    onValueChange={(value: string) => setEditDocument({ ...editDocument, folder: value })}
                                >
                                    <SelectTrigger id="edit-doc-folder" className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
                                        <SelectValue placeholder="Select a folder" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        {folders.map((folder) => (
                                            <SelectItem
                                                className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                                key={folder.id}
                                                value={folder.id as string}
                                            >
                                                {folder.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-doc-status" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Status
                                </Label>
                                <Select
                                    value={editDocument.status}
                                    onValueChange={(value: 'active' | 'draft' | 'archived') => setEditDocument({ ...editDocument, status: value })}
                                >
                                    <SelectTrigger id="edit-doc-status" className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        <SelectItem
                                            className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                            value="draft"
                                        >
                                            Draft
                                        </SelectItem>
                                        <SelectItem
                                            className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                            value="active"
                                        >
                                            Active
                                        </SelectItem>
                                        <SelectItem
                                            className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                            value="archived"
                                        >
                                            Archived
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateDocument}
                                    disabled={!editDocument.name.trim() || !editDocument.folder}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Update Document
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDocumentsPage;