import React from 'react';
import { FileText, Eye, Edit3, Download, Trash2 } from 'lucide-react';

interface DocumentType {
    id: number;
    name: string;
    category: string;
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

interface DocumentTableProps {
    documents: DocumentType[];
    title: string;
    onView: (doc: DocumentType) => void;
    onEdit: (doc: DocumentType) => void;
    onDownload: (doc: DocumentType) => void;
    onDelete: (docId: number) => void;
}

const getStatusColor = (status: 'active' | 'draft' | 'archived'): string => {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const DocumentTable: React.FC<DocumentTableProps> = ({
    documents,
    title,
    onView,
    onEdit,
    onDownload,
    onDelete
}) => {
    if (documents.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                </div>
                <div className="px-6 py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No documents found.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
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
                                Folder
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
                        {documents.map((doc) => (
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
                                    <span className="text-sm text-gray-900 dark:text-white">{doc.category}</span>
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
                                            onClick={() => onView(doc)}
                                            className="text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                                            title="View Document"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => onEdit(doc)}
                                            className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="Edit Document"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => onDownload(doc)}
                                            className="text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                            title="Download Document"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(doc.id)}
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
    );
};

export default DocumentTable;