/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, type FC } from 'react';
import { Plus, FileBadge, FolderPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User } from "../contexts/AuthContext";
import { createAvatar } from '@/lib/helper';
import DocumentViewModal from '@/components/admin/DocumentViewModal';
import AddDocumentModal from '@/components/admin/AddDocumentModal';
import DocumentTable from '@/components/admin/DocumentTable';
import FolderManager from '@/components/admin/FolderManager';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import CreateFolderModal from '@/components/admin/CreateFolderModal';

// Interfaces
interface ApiDocument {
    id: number;
    name: string;
    file_url: string;
    file_size: string;
    priority: string;
    category: string;
    createdAt: string;
    uploadedById: string;
    uploadedByDisplay: string;
    signatures: {
        signed: number;
        totalAssigned: number;
        percentage: number;
    };
}

interface ApiCategory {
    departmentId: null;
    id: string;
    name: string;
    description: string;
    color: string;
    documents: ApiDocument[];
}

interface Department {
    id: number;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface DocumentCategoriesResponse {
    code: string;
    message: string;
    error: boolean;
    payload: ApiCategory[];
}

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
    category: string;
    size: string;
    fileUrl: string;
    priority?: string;
    mimeType?: string;
    fileBase64?: string | null;
}

interface NewDocumentState {
    name: string;
    folder: string;
    expiryFrequency: string;
    file?: File | null;
    url?: string | null;
    status: 'active' | 'draft' | 'archived';
}

interface NewFolderState {
    name: string;
    departmentId: number | null;
    color: string;
}

const AdminDocumentsPage: FC = () => {
    const { authFetch, user } = useAuth();
    const queryClient = useQueryClient();

    // Component state
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showAddDocumentModal, setShowAddDocumentModal] = useState<boolean>(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
    const [documentToDelete, setDocumentToDelete] = useState<DocumentType | null>(null);

    // Local state for folders, documents, and departments
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [allDocuments, setAllDocuments] = useState<DocumentType[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    // URL validation function
    const isValidUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
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

    const fetchDepartments = async (): Promise<Department[]> => {
        try {
            const response = await authFetch('/admin-docs/departments', {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch departments');
            }

            const result = await response.json();

            if (result.error || result.code !== 'SUCCESS') {
                throw new Error(result.message || 'Failed to fetch departments');
            }

            return result.payload;
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    };

    // React Query hooks
    const {
        data: departmentsData = [],
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

    useEffect(() => {
        if (departmentsData) {
            setDepartments(departmentsData);
        }
    }, [departmentsData]);

    // Folder mutations
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
        onSuccess: (responsePayload, folderData) => {
            const newCategory = responsePayload.payload;
            const folder: FolderType = {
                id: newCategory.id,
                name: folderData.name,
                fileCount: 0,
                size: '0 MB',
                color: folderData.color,
                icon: FileBadge,
                departmentId: folderData.departmentId || null
            };

            setFolders(prev => [...prev, folder]);
            setShowCreateFolderModal(false);

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

    // Document mutations
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
                category: documentPayload.category,
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
                fileUrl: documentPayload.fileUrl || documentPayload.finalUrl || "",
            };

            setAllDocuments(prev => [document, ...prev]);
            setFolders(prev => prev.map(folder =>
                folder.id === documentPayload.folder
                    ? { ...folder, fileCount: folder.fileCount + 1 }
                    : folder
            ));

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

    const deleteDocumentMutation = useMutation({
        mutationFn: async (docId: number) => {
            const response = await authFetch(`/admin-docs/${docId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            return response.json();
        },
        onSuccess: (_, docId) => {
            const documentToRemove = allDocuments.find(doc => doc.id === docId);

            setAllDocuments(prev => prev.filter(doc => doc.id !== docId));

            if (documentToRemove) {
                setFolders(prev => prev.map(folder =>
                    folder.id === documentToRemove.folder
                        ? { ...folder, fileCount: Math.max(0, folder.fileCount - 1) }
                        : folder
                ));
            }

            setShowDeleteModal(false);
            setDocumentToDelete(null);

            toast.success("Document deleted", {
                description: "Document has been removed successfully.",
            });
        },
        onError: (error: Error) => {
            toast.error("Error deleting document", {
                description: error.message || "Failed to delete document. Please try again.",
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
                icon: FileBadge,
                description: category.description,
                departmentId: category.departmentId || null
            });

            const actualCategoryDocuments = category.documents.filter(dc => !!dc.id);


            actualCategoryDocuments.forEach(doc => {
                transformedDocuments.push({
                    id: doc.id,
                    name: doc.name,
                    category: doc.category,
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

    // const handleAddDepartment = (departmentData: NewDepartmentState): void => {
    //     createDepartmentMutation.mutate(departmentData);
    // };

    const handleCreateFolder = (folderData: NewFolderState): void => {
        createFolderMutation.mutate(folderData);
    };

    const handleAddDocument = async (documentData: NewDocumentState): Promise<void> => {
        // Validation
        if (!documentData.name.trim() || !documentData.folder) {
            toast.error("Validation Error", {
                description: "Document name and folder are required.",
            });
            return;
        }

        // Check if both file and URL are provided or both are missing
        const hasFile = !!documentData.file;
        const hasUrl = !!documentData.url?.trim();

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
        if (hasUrl && !isValidUrl(documentData.url!)) {
            toast.error("Validation Error", {
                description: "Please enter a valid URL (must start with http:// or https://).",
            });
            return;
        }

        try {
            const documentPayload: any = {
                name: documentData.name,
                uploadedById: (user as User).id,
                uploadedByDisplay: `${(user as User).firstName} ${(user as User).lastName}`,
                departmentId: null,
                folder: documentData.folder,
                content: hasUrl
                    ? `This document is linked to: ${documentData.url}`
                    : 'Document content will be processed and displayed here once uploaded.',
                status: documentData.status,
            };

            if (hasUrl) {
                documentPayload.fileUrl = documentData.url;
                documentPayload.size = 'External Link';
                documentPayload.mimeType = 'text/html';
                documentPayload.fileBase64 = null;
            } else if (hasFile) {
                const fileBase64 = await getDocumentBase64(documentData.file!);
                documentPayload.size = `${Math.round(documentData.file!.size / 1024)} KB`;
                documentPayload.mimeType = documentData.file!.type || 'application/octet-stream';
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
            window.open(doc.fileUrl, '_blank');
        } else {
            const link = document.createElement('a');
            link.href = doc.fileUrl;
            link.download = doc.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleEditDocument = (doc: DocumentType): void => {
        // For now, we'll just show the view modal
        // You can implement a separate EditDocumentModal later
        handleViewDocument(doc);
    };

    const handleDeleteDocument = (docId: number): void => {
        const document = allDocuments.find(doc => doc.id === docId);
        if (document) {
            setDocumentToDelete(document);
            setShowDeleteModal(true);
        }
    };

    const confirmDeleteDocument = (): void => {
        if (documentToDelete) {
            deleteDocumentMutation.mutate(documentToDelete.id);
        }
    };

    // Computed values
    const filteredDocuments: DocumentType[] = selectedFolder
        ? allDocuments.filter(doc => doc.folder === selectedFolder)
        : allDocuments;

    const isLoading = documentsLoading || departmentsLoading;
    const hasError = documentsError || departmentsError;

    const documentTableTitle = selectedFolder
        ? `${folders.find(f => f.id === selectedFolder)?.name || 'Selected Folder'} Files`
        : 'All Files';

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
                            onClick={() => setShowCreateFolderModal(true)}
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
                {/* Folder Manager Component */}
                <FolderManager
                    folders={folders}
                    departments={departments}
                    selectedFolder={selectedFolder}
                    onFolderClick={handleFolderClick}
                    onFolderSelect={setSelectedFolder}
                    onFolderCreated={(folder) => setFolders(prev => [...prev, folder])}
                    onFolderUpdated={(folder) => {
                        setFolders(prev => prev.map(f => f.id === folder.id ? folder : f));
                    }}
                    onFolderDeleted={(folderId) => {
                        setFolders(prev => prev.filter(f => f.id !== folderId));
                    }}
                    isLoading={isLoading}
                    error={hasError ? new Error('Failed to load data') : null}
                    onRetry={() => {
                        refetchDocuments();
                        queryClient.invalidateQueries({ queryKey: ['departments'] });
                    }}
                    hideCreateButton={true}
                />

                {/* Documents Table */}
                {!isLoading && !hasError && (
                    <DocumentTable
                        documents={filteredDocuments}
                        title={documentTableTitle}
                        onView={handleViewDocument}
                        onEdit={handleEditDocument}
                        onDownload={handleDownloadDocument}
                        onDelete={handleDeleteDocument}
                    />
                )}
            </div>

            {/* Add Document Modal */}
            <AddDocumentModal
                isOpen={showAddDocumentModal}
                onClose={() => setShowAddDocumentModal(false)}
                onSubmit={handleAddDocument}
                folders={folders}
                isLoading={createDocumentMutation.isPending}
            />

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                onSubmit={handleCreateFolder}
                departments={departments}
                isLoading={createFolderMutation.isPending}
                title="Add New Folder"
                submitText="Add Folder"
            />

            {/* Add Department Modal */}
            {/* <AddDepartmentModal
                isOpen={showAddDepartmentModal}
                onClose={() => setShowAddDepartmentModal(false)}
                onSubmit={handleAddDepartment}
                isLoading={createDepartmentMutation.isPending}
            /> */}

            {/* View Document Modal */}
            <DocumentViewModal
                showViewModal={showViewModal}
                setShowViewModal={setShowViewModal}
                selectedDocument={selectedDocument}
            />

            {/* Delete Document Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDocumentToDelete(null);
                }}
                onConfirm={confirmDeleteDocument}
                title="Delete Document"
                message={`Are you sure you want to delete the document "${documentToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Document"
                cancelText="Cancel"
                isLoading={deleteDocumentMutation.isPending}
                type="danger"
            />
        </div>
    );
};

export default AdminDocumentsPage;

