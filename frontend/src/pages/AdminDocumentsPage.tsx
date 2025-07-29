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
} from 'lucide-react';

// --- Type Definitions ---

// Interface for a Folder object
interface FolderType {
    id: string;
    name: string;
    fileCount: number;
    size: string;
    color: string;
    icon: React.ElementType;
}

// Interface for a Document object
interface DocumentType {
    id: number;
    name: string;
    uploadedBy: string;
    avatar: string;
    date: string;
    status: 'active' | 'draft' | 'archived'; // Specific string literal types for status
    signatureRate: number;
    folder: string;
    size: string;
    content: string;
    fileUrl: string;
}

// Interface for the new document state
interface NewDocumentState {
    name: string;
    folder: string;
    file: File | null; // File type for uploaded file, or null
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
    // State declarations with explicit types
    // const [selectedView, setSelectedView] = useState<string>('all');
    // const [sortBy, setSortBy] = useState<string>('latest');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showAddDocumentModal, setShowAddDocumentModal] = useState<boolean>(false);
    const [showAddFolderModal, setShowAddFolderModal] = useState<boolean>(false);
    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);

    const [folders, setFolders] = useState<FolderType[]>([
        {
            id: 'policies',
            name: 'Company Policies',
            fileCount: 12,
            size: '2.3 MB',
            color: 'bg-blue-500',
            icon: Folder
        },
        {
            id: 'contracts',
            name: 'Employment Contracts',
            fileCount: 45,
            size: '15.7 MB',
            color: 'bg-green-500',
            icon: Folder
        },
        {
            id: 'training',
            name: 'Training Materials',
            fileCount: 28,
            size: '8.4 MB',
            color: 'bg-purple-500',
            icon: Folder
        },
        {
            id: 'compliance',
            name: 'Compliance Documents',
            fileCount: 18,
            size: '3.9 MB',
            color: 'bg-orange-500',
            icon: Folder
        }
    ]);

    const [allDocuments, setAllDocuments] = useState<DocumentType[]>([
        {
            id: 1,
            name: 'Whistleblowing Policy v2.1',
            uploadedBy: 'Malloron Nair',
            avatar: 'MN',
            date: 'Nov 15, 2024',
            status: 'active',
            signatureRate: 95,
            folder: 'policies',
            size: '245 KB',
            content: 'This policy outlines the procedures for reporting workplace misconduct and ensures protection for whistleblowers. It establishes clear channels for reporting violations, investigation procedures, and protection measures for employees who report in good faith.',
            fileUrl: '/documents/whistleblowing-policy-v2.1.pdf'
        },
        {
            id: 2,
            name: 'Employment Contract Template',
            uploadedBy: 'Preneshni Moodley',
            avatar: 'PM',
            date: 'Nov 14, 2024',
            status: 'draft',
            signatureRate: 0,
            folder: 'contracts',
            size: '312 KB',
            content: 'Standard employment contract template for new hires including terms of employment, compensation, benefits, confidentiality clauses, and termination procedures. This template serves as the foundation for all new employee contracts.',
            fileUrl: '/documents/employment-contract-template.pdf'
        },
        {
            id: 3,
            name: 'Code of Conduct',
            uploadedBy: 'Hemansu Keeka',
            avatar: 'HK',
            date: 'Nov 12, 2024',
            status: 'active',
            signatureRate: 73,
            folder: 'policies',
            size: '428 KB',
            content: 'Company code of conduct and ethical guidelines covering professional behavior, conflict of interest, data privacy, and compliance with applicable laws and regulations. All employees must acknowledge and adhere to these standards.',
            fileUrl: '/documents/code-of-conduct.pdf'
        },
        {
            id: 4,
            name: 'Safety Guidelines',
            uploadedBy: 'Preneshni Moodley',
            avatar: 'PM',
            date: 'Nov 10, 2024',
            status: 'active',
            signatureRate: 89,
            folder: 'compliance',
            size: '186 KB',
            content: 'Comprehensive workplace safety guidelines covering emergency procedures, hazard identification, personal protective equipment requirements, and incident reporting protocols. Essential reading for all staff members.',
            fileUrl: '/documents/safety-guidelines.pdf'
        }
    ]);

    const [newDocument, setNewDocument] = useState<NewDocumentState>({
        name: '',
        folder: '',
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
            default: return 'bg-gray-100 text-gray-800'; // Fallback for unexpected status
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
            id: Date.now(), // Unique ID for the new document
            name: newDocument.name,
            uploadedBy: 'Current User', // Placeholder for current user
            avatar: 'CU', // Placeholder for current user avatar initials
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            status: newDocument.status,
            signatureRate: 0, // New documents start with 0 signatures
            folder: newDocument.folder,
            size: newDocument.file ? `${Math.round(newDocument.file.size / 1024)} KB` : '0 KB',
            content: 'Document content will be processed and displayed here once uploaded.',
            fileUrl: newDocument.file ? URL.createObjectURL(newDocument.file) : '#' // Create object URL for file preview
        };

        setAllDocuments([document, ...allDocuments]); // Add new document to the beginning of the list

        // Update folder file count
        setFolders(folders.map(folder =>
            folder.id === newDocument.folder
                ? { ...folder, fileCount: folder.fileCount + 1 }
                : folder
        ));

        // Reset new document form and close modal
        setNewDocument({ name: '', folder: '', file: null, status: 'draft' });
        setShowAddDocumentModal(false);
    };

    // Handle adding a new folder
    const handleAddFolder = (): void => {
        if (!newFolder.name) {
            console.warn("Folder name is required.");
            return;
        }

        const folder: FolderType = {
            id: newFolder.name.toLowerCase().replace(/\s+/g, '-'), // Generate a slug-like ID
            name: newFolder.name,
            fileCount: 0,
            size: '0 MB',
            color: newFolder.color,
            icon: Folder // Default icon for new folders
        };

        setFolders([...folders, folder]); // Add new folder to the list
        setNewFolder({ name: '', color: 'bg-blue-500' }); // Reset new folder form
        setShowAddFolderModal(false); // Close modal
    };

    // Handle viewing a document (opens view modal)
    const handleViewDocument = (doc: DocumentType): void => {
        setSelectedDocument(doc);
        setShowViewModal(true);
    };

    // Handle downloading a document
    const handleDownloadDocument = (doc: DocumentType): void => {
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = doc.name; // Suggest file name for download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // In a real app, consider using a non-blocking notification instead of alert
        console.log(`Downloading ${doc.name}...`);
    };

    // Handle editing a document (sets edit state and opens edit modal)
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

        // Update folder counts if the document's folder changed
        if (oldFolderId !== newFolderId) {
            setFolders(folders.map(folder => {
                if (folder.id === oldFolderId) {
                    return { ...folder, fileCount: Math.max(0, folder.fileCount - 1) }; // Decrement old folder count
                }
                if (folder.id === newFolderId) {
                    return { ...folder, fileCount: folder.fileCount + 1 }; // Increment new folder count
                }
                return folder;
            }));
        }

        setShowEditModal(false); // Close modal
        setEditDocument({ id: null, name: '', folder: '', status: 'draft' }); // Reset edit state
    };

    // Handle deleting a document
    const handleDeleteDocument = (docId: number): void => {
        // Using a custom modal for confirmation instead of window.confirm
        if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            const documentToDelete = allDocuments.find(doc => doc.id === docId);

            setAllDocuments(allDocuments.filter(doc => doc.id !== docId));

            // Update folder file count
            if (documentToDelete) {
                setFolders(folders.map(folder =>
                    folder.id === documentToDelete.folder
                        ? { ...folder, fileCount: Math.max(0, folder.fileCount - 1) } // Ensure count doesn't go below zero
                        : folder
                ));
            }
        }
    };

    // Modal Component (defined inline for simplicity, could be a separate component)
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
                                        <folder.icon className="w-5 h-5 text-white" /> {/* Use folder.icon as a component */}
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

                {/* All Files Table */}
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
            </div>

            {/* Add Document Modal */}
            <Modal
                show={showAddDocumentModal}
                onClose={() => setShowAddDocumentModal(false)}
                title="Add New Document"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="new-doc-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Document Name
                        </label>
                        <input
                            id="new-doc-name"
                            type="text"
                            value={newDocument.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDocument({ ...newDocument, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter document name"
                        />
                    </div>

                    <div>
                        <label htmlFor="new-doc-folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Folder
                        </label>
                        <select
                            id="new-doc-folder"
                            value={newDocument.folder}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDocument({ ...newDocument, folder: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Select a folder</option>
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="new-doc-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Upload File (Optional)
                        </label>
                        <input
                            id="new-doc-file"
                            type="file"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDocument({ ...newDocument, file: e.target.files ? e.target.files[0] : null })}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setShowAddDocumentModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddDocument}
                            disabled={!newDocument.name || !newDocument.folder}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4 inline-block mr-2" />
                            Add Document
                        </button>
                    </div>
                </div>
            </Modal>

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
