import React, { useState, type FC } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

// Interface for API Document
interface ApiDocument {
    id: number;
    name: string;
    file_url: string;
    file_size: string;
    priority: string;
    createdAt: string;
}

// Interface for API Category
interface ApiCategory {
    id: string;
    name: string;
    description: string;
    color: string;
    documents: ApiDocument[];
}

// Interface for API Response
interface ApiResponse {
    code: string;
    message: string;
    error: boolean;
    payload: ApiCategory[];
}

// Interface for a Folder object (transformed from API)
interface FolderType {
    id: string;
    name: string;
    fileCount: number;
    size: string;
    color: string;
    icon: React.ElementType;
    description?: string;
}

// Interface for a Document object (transformed from API)
interface DocumentType {
    id: number;
    name: string;
    uploadedBy: string;
    avatar: string;
    date: string;
    status: 'active' | 'draft' | 'archived';
    signatureRate: number;
    folder: string;
    size: string;
    content: string;
    fileUrl: string;
    priority?: string;
}

// Interface for the new document state
interface NewDocumentState {
    name: string;
    folder: string;
    expiryFrequency: string;
    file: File | null;
    status: 'active' | 'draft' | 'archived';
}

// Interface for the new folder state
interface NewFolderState {
    name: string;
    color: string;
}

// Interface for the edit document state
interface EditDocumentState {
    id: number | null;
    name: string;
    folder: string;
    status: 'active' | 'draft' | 'archived';
}

// Interface for Modal component props
interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const AdminDocumentsPage: FC = () => {
    const { authFetch } = useAuth()
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showAddDocumentModal, setShowAddDocumentModal] = useState<boolean>(false);
    const [showAddFolderModal, setShowAddFolderModal] = useState<boolean>(false);
    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
    const [isDragging, setIsDragging] = useState(false)

    // State for folders and documents (will be populated from API)
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [allDocuments, setAllDocuments] = useState<DocumentType[]>([]);

    const renewalFrequencies = [{
        id: 1,
        name: 'Weekly',
    }, {
        id: 2,
        name: 'Monthly',
    }, {
        id: 3,
        name: 'Quarterly',
    }, {
        id: 4,
        name: 'Bi-Annually',
    },
    {
        id: 6,
        name: 'Never',
        className: 'text-gray-400 dark:text-gray-500'
    }]

    // Helper function to calculate file size from multiple documents
    const calculateTotalSize = (documents: ApiDocument[]): string => {
        const totalBytes = documents.reduce((total, doc) => {
            const sizeStr = doc.file_size.toLowerCase();
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

    // Helper function to transform API data
    const transformApiData = (apiData: ApiCategory[]) => {
        const transformedFolders: FolderType[] = [];
        const transformedDocuments: DocumentType[] = [];

        apiData.forEach(category => {
            // Transform category to folder
            transformedFolders.push({
                id: category.id,
                name: category.name,
                fileCount: category.documents.length,
                size: calculateTotalSize(category.documents),
                color: category.color,
                icon: Folder,
                description: category.description
            });

            // Transform documents
            category.documents.forEach(doc => {
                transformedDocuments.push({
                    id: doc.id,
                    name: doc.name,
                    uploadedBy: 'System User', // Default since API doesn't provide this
                    avatar: 'SU',
                    date: new Date(doc.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }),
                    status: 'active', // Default since API doesn't provide this
                    signatureRate: Math.floor(Math.random() * 100), // Random since API doesn't provide this
                    folder: category.id,
                    size: doc.file_size,
                    content: `This is the ${doc.name} document. Content will be loaded when the document is accessed.`,
                    fileUrl: doc.file_url,
                    priority: doc.priority
                });
            });
        });

        return { folders: transformedFolders, documents: transformedDocuments };
    };

    const fetchDocumentCategories = async (): Promise<{ folders: FolderType[], documents: DocumentType[] }> => {
        try {
            const response = await authFetch('/admin-docs/categories-with-documents', {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch document categories');
            }

            const result: ApiResponse = await response.json();

            if (result.error || result.code !== 'SUCCESS') {
                throw new Error(result.message || 'Failed to fetch document categories');
            }

            return transformApiData(result.payload);
        } catch (error) {
            console.error('Error fetching document categories:', error);
            throw error;
        }
    };

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['documentsCategories'],
        queryFn: fetchDocumentCategories,
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 2,
        // onSuccess: (data) => {
        //     setFolders(data.folders);
        //     setAllDocuments(data.documents);
        // }
    });

    // Use the data from the query if available
    React.useEffect(() => {
        if (data) {
            setFolders(data.folders);
            setAllDocuments(data.documents);
        }
    }, [data]);

    const [newDocument, setNewDocument] = useState<NewDocumentState>({
        name: '',
        folder: '',
        expiryFrequency: '',
        file: null,
        status: 'draft'
    });

    const [newFolder, setNewFolder] = useState<NewFolderState>({
        name: '',
        color: 'bg-blue-500'
    });

    const [editDocument, setEditDocument] = useState<EditDocumentState>({
        id: null,
        name: '',
        folder: '',
        status: 'draft'
    });

    // Helper function to get status color class
    const getStatusColor = (status: 'active' | 'draft' | 'archived'): string => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Filter documents based on selected folder
    const filteredDocuments: DocumentType[] = selectedFolder
        ? allDocuments.filter(doc => doc.folder === selectedFolder)
        : allDocuments;

    // Handle folder click to filter documents
    const handleFolderClick = (folderId: string): void => {
        setSelectedFolder(selectedFolder === folderId ? null : folderId);
    };

    // Handle adding a new document
    const handleAddDocument = (): void => {
        if (!newDocument.name || !newDocument.folder) {
            console.warn("Document name and folder are required.");
            return;
        }

        const document: DocumentType = {
            id: Date.now(),
            name: newDocument.name,
            uploadedBy: 'Current User',
            avatar: 'CU',
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            status: newDocument.status,
            signatureRate: 0,
            folder: newDocument.folder,
            size: newDocument.file ? `${Math.round(newDocument.file.size / 1024)} KB` : '0 KB',
            content: 'Document content will be processed and displayed here once uploaded.',
            fileUrl: newDocument.file ? URL.createObjectURL(newDocument.file) : '#'
        };

        setAllDocuments([document, ...allDocuments]);

        // Update folder file count
        setFolders(folders.map(folder =>
            folder.id === newDocument.folder
                ? { ...folder, fileCount: folder.fileCount + 1 }
                : folder
        ));

        setNewDocument({ name: '', folder: '', file: null, status: 'draft', expiryFrequency: '' });
        setShowAddDocumentModal(false);
    };

    // Handle adding a new folder
    const handleAddFolder = (): void => {
        if (!newFolder.name) {
            console.warn("Folder name is required.");
            return;
        }

        const folder: FolderType = {
            id: newFolder.name.toLowerCase().replace(/\s+/g, '-'),
            name: newFolder.name,
            fileCount: 0,
            size: '0 MB',
            color: newFolder.color,
            icon: Folder
        };

        setFolders([...folders, folder]);
        setNewFolder({ name: '', color: 'bg-blue-500' });
        setShowAddFolderModal(false);
    };

    // Handle viewing a document
    const handleViewDocument = (doc: DocumentType): void => {
        setSelectedDocument(doc);
        setShowViewModal(true);
    };

    // Handle downloading a document
    const handleDownloadDocument = (doc: DocumentType): void => {
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`Downloading ${doc.name}...`);
    };

    // Handle editing a document
    const handleEditDocument = (doc: DocumentType): void => {
        setEditDocument({
            id: doc.id,
            name: doc.name,
            folder: doc.folder,
            status: doc.status
        });
        setShowEditModal(true);
    };

    // Handle updating an existing document
    const handleUpdateDocument = (): void => {
        if (!editDocument.name || !editDocument.folder || editDocument.id === null) {
            console.warn("Document name, folder, and ID are required for update.");
            return;
        }

        const oldDocument = allDocuments.find(doc => doc.id === editDocument.id);
        const oldFolderId = oldDocument?.folder;
        const newFolderId = editDocument.folder;

        setAllDocuments(allDocuments.map(doc =>
            doc.id === editDocument.id
                ? { ...doc, name: editDocument.name, folder: editDocument.folder, status: editDocument.status }
                : doc
        ));

        if (oldFolderId !== newFolderId) {
            setFolders(folders.map(folder => {
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
    };

    // Handle deleting a document
    const handleDeleteDocument = (docId: number): void => {
        if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            const documentToDelete = allDocuments.find(doc => doc.id === docId);

            setAllDocuments(allDocuments.filter(doc => doc.id !== docId));

            if (documentToDelete) {
                setFolders(folders.map(folder =>
                    folder.id === documentToDelete.folder
                        ? { ...folder, fileCount: Math.max(0, folder.fileCount - 1) }
                        : folder
                ));
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setNewDocument({ ...newDocument, file: e.dataTransfer.files[0] })
            e.dataTransfer.clearData()
        }
    }

    // Modal Component
    const Modal: FC<ModalProps> = ({ show, onClose, title, children }) => {
        if (!show) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

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
                {/* Folders Section */}
                {isLoading ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Loading documents categories...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12">
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading document categories</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {error instanceof Error ? error.message : 'Something went wrong'}
                            </p>
                            <Button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600 text-white">
                                Try Again
                            </Button>
                        </div>
                    </div>
                ) : (
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
                            {folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    onClick={() => handleFolderClick(folder.id)}
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
                    </div>
                )}

                {/* All Files Table */}
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
                                                    <span className="text-sm text-gray-900 dark:text-white">{doc.uploadedBy}</span>
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
                                    Document Name
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
                                    <SelectTrigger id='renewal-frequency' className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        <SelectValue placeholder="Expiry Frequency" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        {renewalFrequencies.map((renewal) => (
                                            <SelectItem
                                                className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                                key={renewal.id} value={renewal.name}>
                                                {renewal.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="new-doc-folder" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Folder
                                </Label>
                                <Select
                                    value={newDocument.folder}
                                    onValueChange={(value: string) => setNewDocument({ ...newDocument, folder: value })}
                                >
                                    <SelectTrigger id='new-doc-folder' className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        <SelectValue placeholder="Select a folder" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        {folders.map((folder) => (
                                            <SelectItem
                                                className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                                key={folder.id} value={folder.id}>
                                                {folder.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label
                                    htmlFor="new-doc-file"
                                    className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                                >
                                    Upload File (Optional)
                                </Label>

                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        setIsDragging(true)
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition
                                    ${isDragging ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"}
                                    hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 cursor-pointer`}
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
                                    />
                                </div>
                            </div>
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
                                    disabled={!newDocument.name || !newDocument.folder}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                                >
                                    <Save className="w-5 h-5 inline-block mr-2" />
                                    Add Document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Folder Modal */}
            <Modal
                show={showAddFolderModal}
                onClose={() => setShowAddFolderModal(false)}
                title="Add New Folder"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="new-folder-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Folder Name
                        </label>
                        <input
                            id="new-folder-name"
                            type="text"
                            value={newFolder.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolder({ ...newFolder, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter folder name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Folder Color
                        </label>
                        <div className="flex gap-2">
                            {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setNewFolder({ ...newFolder, color: color })}
                                    className={`w-10 h-10 rounded-lg ${color} ${newFolder.color === color ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-800' : ''} hover:scale-110 transition-transform`}
                                    title={color.replace('bg-', '')}
                                ></button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setShowAddFolderModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddFolder}
                            disabled={!newFolder.name}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Folder
                        </button>
                    </div>
                </div>
            </Modal>

            {/* View Document Modal */}
            <Modal
                show={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="View Document"
            >
                {selectedDocument && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDocument.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Uploaded by {selectedDocument.uploadedBy} on {selectedDocument.date}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDocument.status)}`}>
                                    {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1)}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Size:</span>
                                <span className="ml-2 text-sm text-gray-900 dark:text-white">{selectedDocument.size}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Signatures:</span>
                                <span className="ml-2 text-sm text-gray-900 dark:text-white">{selectedDocument.signatureRate}%</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Folder:</span>
                                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                    {folders.find(f => f.id === selectedDocument.folder)?.name || 'Unknown'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Preview:</h4>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 max-h-32 overflow-y-auto">
                                {selectedDocument.content}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => handleDownloadDocument(selectedDocument)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleEditDocument(selectedDocument);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Document Modal */}
            <Modal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Document"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="edit-doc-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Document Name
                        </label>
                        <input
                            id="edit-doc-name"
                            type="text"
                            value={editDocument.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDocument({ ...editDocument, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter document name"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-doc-folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Folder
                        </label>
                        <select
                            id="edit-doc-folder"
                            value={editDocument.folder}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditDocument({ ...editDocument, folder: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Select a folder</option>
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="edit-doc-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            id="edit-doc-status"
                            value={editDocument.status}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditDocument({ ...editDocument, status: e.target.value as 'active' | 'draft' | 'archived' })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateDocument}
                            disabled={!editDocument.name || !editDocument.folder}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4 inline-block mr-2" />
                            Update Document
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminDocumentsPage;