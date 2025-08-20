import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, X, AlertCircle, Clock, Clock10 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toCamelCase } from '../../lib/helper';

// Define the shape of a folder object
// interface Folder {
//     id: string | number;
//     name: string;
// }

// Define the shape of the selectedDocument object
interface Document {
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

// Define the signature status data shape
interface SignatureStatus {
    signed: Array<{ id: string; name: string; signedAt: string }>;
    notSigned: Array<{ id: string; name: string; status: string }>;
}

interface DepartmentSignatureResponse {
    code: string;
    message: string;
    error: boolean;
    payload: SignatureStatus;
}

// Define the props for the DocumentViewModal component
interface DocumentViewModalProps {
    showViewModal: boolean;
    setShowViewModal: (show: boolean) => void;
    selectedDocument: Document | null;
    // handleDownloadDocument: (doc: Document) => void;
    // handleEditDocument: (doc: Document) => void;
    // folders: Folder[];
}


const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
        case 'signed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
        case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
        case 'overdue': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
        case 'viewed': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
        default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
};

const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
        case 'signed': return <CheckCircle className="w-3 h-3" />;
        case 'pending': return <Clock className="w-3 h-3" />;
        case 'overdue': return <AlertCircle className="w-3 h-3" />;
        default: return <Clock className="w-3 h-3" />;
    }
};

const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
    showViewModal,
    setShowViewModal,
    selectedDocument,
    // handleDownloadDocument,
    // handleEditDocument,
    // folders
}) => {
    const { authFetch } = useAuth();
    const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch signature status when the modal is opened
    useEffect(() => {
        if (showViewModal && selectedDocument) {
            const fetchSignatures = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await authFetch(`/admin-docs/${selectedDocument.id}/signatures`, {
                        method: 'GET',
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch signature data.');
                    }
                    const data: DepartmentSignatureResponse = await response.json();

                    if (data.payload) {
                        setSignatureStatus(data.payload);
                    } else {
                        setError(data.message);
                    }
                } catch (err) {
                    console.error("Fetch error:", err);
                    if (err instanceof Error) {
                        setError(err.message);
                    } else {
                        setError('An unknown error occurred.');
                    }
                } finally {
                    setLoading(false);
                }
            };
            fetchSignatures();
        } else {
            // Reset state when modal is closed
            setSignatureStatus(null);
        }
    }, [showViewModal, selectedDocument, authFetch]);

    const SignatureSection: React.FC = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">Loading signature data...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-red-700 dark:text-red-300 text-sm font-medium">Error loading signatures</span>
                    </div>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
                </div>
            );
        }

        if (!signatureStatus) {
            return (
                <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No signature data available</p>
                </div>
            );
        }

        const totalUsers = signatureStatus.signed.length + signatureStatus.notSigned.length;
        const signedPercentage = totalUsers > 0 ? (signatureStatus.signed.length / totalUsers) * 100 : 0;

        return (
            <div className="space-y-6">
                {/* Progress Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Signature Progress</h4>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {signatureStatus.signed.length} of {totalUsers} signed
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${signedPercentage}%` }}
                        ></div>
                    </div>
                </div>

                {/* Signed Users Section */}
                {signatureStatus.signed.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="w-5 h-5" />
                                Signed ({signatureStatus.signed.length})
                            </div>
                        </h4>
                        <div className="space-y-2">
                            {signatureStatus.signed.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                                    </div>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                        {new Date(user.signedAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Not Signed Users Section */}
                {signatureStatus.notSigned.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                <XCircle className="w-5 h-5" />
                                Pending Signatures ({signatureStatus.notSigned.length})
                            </div>
                        </h4>
                        <div className="space-y-2">
                            {signatureStatus.notSigned.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                            {getStatusIcon(user.status)}
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)} flex items-center gap-1`}>
                                        {getStatusIcon(user.status)}
                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All signed message */}
                {signatureStatus.signed.length > 0 && signatureStatus.notSigned.length === 0 && (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">All users have signed this document!</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (!showViewModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                    <button
                        onClick={() => setShowViewModal(false)}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {selectedDocument && (
                        <div className="flex items-center gap-4 text-white pr-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <FileText className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1">{selectedDocument.name}</h3>
                                <p className="text-white/80 text-sm">
                                    Uploaded by {selectedDocument.uploadedByDisplay} • {selectedDocument.date}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {selectedDocument && (
                        <div className="space-y-6">
                            {/* Document Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{toCamelCase(selectedDocument.status)}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Size</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedDocument.size}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Signatures</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedDocument.signatureRate}%</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Priority</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{toCamelCase(selectedDocument.priority || 'None')}</div>
                                </div>
                            </div>

                            {/* Signature Details */}
                            <SignatureSection />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl">
                            <Clock10 className="w-4 h-4" />
                            Send Reminder
                        </button>
                        <button
                            onClick={() => {
                                setShowViewModal(false);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                        >
                            <X className="w-4 h-4" />
                            Close Modal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewModal;
