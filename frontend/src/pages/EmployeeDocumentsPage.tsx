/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, type FC } from 'react';
import {
    FileText,
    Download,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    Search,
    FileBadge,
    PenTool,
    X,
    Loader2,
    type LucideIcon
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import DocumentViewer from '@/components/DocumentViewer';
import { toast } from 'sonner';
import { formatDate } from '@/lib/helper';

// Interface for API Response
interface ApiResponse {
    code: string;
    message: string;
    error: boolean;
    payload: ApiCategory[];
}

// Interface for Document Completion Response
interface DocumentCompletionResponse {
    code: string;
    message: string;
    error: boolean;
    payload?: any;
}

// Interface for Document View Response
interface DocumentViewResponse {
    code: string;
    message: string;
    error: boolean;
    payload?: any;
}

interface DocumentCategoryType {
    id: string;
    name: string;
    count: number;
    color: string;
    description: string;
}

// Interface for a Document object (transformed from API)
interface DocumentType {
    id: number;
    name: string;
    category: string;
    categoryId: string;
    createdAt: string;
    dueDate?: string;
    status: 'pending' | 'signed' | 'viewed' | 'overdue' | 'completed',
    size: string;
    priority: 'high' | 'medium' | 'low';
    fileUrl: string;
    signedDate?: string;
}

// Interface for API Category
interface ApiCategory {
    id: string;
    name: string;
    description: string;
    color: string;
    documents: DocumentType[];
}

// Interface for Status Configuration
interface StatusConfig {
    icon: LucideIcon;
    color: string;
    bgColor: string;
    textColor: string;
    label: string;
}

// Interface for Modal component props
interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const EmployeeDocumentsPage: FC = () => {
    const { authFetch, user } = useAuth();
    const queryClient = useQueryClient();

    // State declarations with explicit types
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showSignatureDialog, setShowSignatureDialog] = useState<boolean>(false);
    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [showDocumentViewer, setShowDocumentViewer] = useState<boolean>(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);

    // State for categories and documents (will be populated from API)
    const [documentCategories, setDocumentCategories] = useState<DocumentCategoryType[]>([]);
    const [allDocuments, setAllDocuments] = useState<DocumentType[]>([]);

    // Helper function to transform API data
    const transformApiData = (apiData: ApiCategory[]) => {
        const transformedCategories: DocumentCategoryType[] = [];
        const transformedDocuments: DocumentType[] = [];

        apiData.forEach(category => {
            // Transform category
            transformedCategories.push({
                id: category.id,
                name: category.name,
                count: category.documents.length,
                color: category.color,
                description: category.description
            });

            // Transform documents
            category.documents.forEach(doc => {
                transformedDocuments.push({
                    id: doc.id,
                    name: doc.name,
                    category: category.name,
                    categoryId: category.id,
                    status: doc.status as 'pending' | 'signed' | 'viewed' | 'overdue' | 'completed',
                    size: doc.size,
                    priority: doc.priority as 'high' | 'medium' | 'low',
                    fileUrl: doc.fileUrl,
                    signedDate: doc.signedDate,
                    createdAt: doc.createdAt,
                });
            });
        });

        return { categories: transformedCategories, documents: transformedDocuments };
    };

    const fetchUserDocuments = async (): Promise<{ categories: DocumentCategoryType[], documents: DocumentType[] }> => {
        try {
            const userId = user?.id || '1';

            const response = await authFetch(`/user-docs/by-category/${userId}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user documents');
            }

            const result: ApiResponse = await response.json();

            if (result.error || result.code !== 'SUCCESS') {
                throw new Error(result.message || 'Failed to fetch user documents');
            }

            return transformApiData(result.payload);
        } catch (error) {
            console.error('Error fetching user documents:', error);
            throw error;
        }
    };

    // Document completion mutation
    const documentCompletionMutation = useMutation({
        mutationFn: async ({ userId, documentId }: { userId: string; documentId: number }) => {
            const response = await authFetch('/user-docs/document-completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    document_id: documentId,
                    acknowledgement_checked: true
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to complete document signature');
            }

            const result: DocumentCompletionResponse = await response.json();

            if (result.error || result.code !== 'SUCCESS') {
                throw new Error(result.message || 'Failed to complete document signature');
            }

            return result;
        },
        onSuccess: (data, variables) => {
            // Update local state to reflect the signed document
            setAllDocuments(prev => prev.map(doc =>
                doc.id === variables.documentId
                    ? {
                        ...doc,
                        status: 'signed' as const,
                        signedDate: new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })
                    }
                    : doc
            ));

            // Close the signature dialog
            setShowSignatureDialog(false);
            setSelectedDocument(null);

            // Invalidate and refetch the documents to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['userDocuments', user?.id] });

            console.log(`Document "${selectedDocument?.name}" has been signed successfully!`);

            toast.success('Document signed', {
                description: `Successfully signed document "${selectedDocument?.name}".`,
            })
        },
        onError: (error) => {
            console.error('Error signing document:', error);
            toast.error("Error signing document", {
                description: error instanceof Error ? error.message : "Failed to sign document. Please try again.",
            })
        },
    });

    // Document view mutation
    const documentViewMutation = useMutation({
        mutationFn: async ({ userId, documentId }: { userId: string; documentId: number }) => {
            const response = await authFetch('/user-docs/document-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    document_id: documentId,
                    // TODO: look into capturing this data as its part of the requirements
                    progress_data: { "page": Math.floor(Math.random() * 100), "scrollPosition": Math.floor(Math.random() * 100) },
                    time_spent: Math.floor(Math.random() * 100),
                    duration: Math.floor(Math.random() * 100)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to mark document as viewed');
            }

            const result: DocumentViewResponse = await response.json();

            if (result.error || result.code !== 'SUCCESS') {
                throw new Error(result.message || 'Failed to mark document as viewed');
            }

            return result;
        },
        onSuccess: (data, variables) => {
            // Update local state to reflect the viewed document
            setAllDocuments(prev => prev.map(doc =>
                doc.id === variables.documentId && doc.status === 'pending'
                    ? { ...doc, status: 'viewed' as const }
                    : doc
            ));

            // Invalidate and refetch the documents to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['userDocuments', user?.id] });

            console.log(`Document marked as viewed successfully!`);
        },
        onError: (error) => {
            console.error('Error marking document as viewed:', error);
            toast.error("Error marking document as viewed", {
                description: error instanceof Error ? error.message : "Failed to mark document as viewed. Please try again.",
            })
        },
    });

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['userDocuments', user?.id],
        queryFn: fetchUserDocuments,
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 2,
        enabled: !!user?.id,
    });

    // Use the data from the query if available
    React.useEffect(() => {
        if (data) {
            setDocumentCategories(data.categories);
            setAllDocuments(data.documents);
        }
    }, [data]);

    // Helper function to get status configuration
    const getStatusConfig = (status: DocumentType['status']): StatusConfig => {
        switch (status) {
            case 'signed':
                return {
                    icon: CheckCircle,
                    color: 'text-green-500',
                    bgColor: 'bg-green-100 dark:bg-green-900/30',
                    textColor: 'text-green-800 dark:text-green-400',
                    label: 'Signed'
                };
            case 'completed':
                return {
                    icon: CheckCircle,
                    color: 'text-green-500',
                    bgColor: 'bg-green-100 dark:bg-green-900/30',
                    textColor: 'text-green-800 dark:text-green-400',
                    label: 'Signed'
                };
            case 'pending':
                return {
                    icon: Clock,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
                    textColor: 'text-yellow-800 dark:text-yellow-400',
                    label: 'Pending Signature'
                };
            case 'viewed':
                return {
                    icon: Eye,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                    textColor: 'text-blue-800 dark:text-blue-400',
                    label: 'Viewed'
                };
            case 'overdue':
                return {
                    icon: AlertCircle,
                    color: 'text-red-500',
                    bgColor: 'bg-red-100 dark:bg-red-900/30',
                    textColor: 'text-red-800 dark:text-red-400',
                    label: 'Overdue'
                };
            default:
                return {
                    icon: FileText,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
                    textColor: 'text-gray-800 dark:text-gray-400',
                    label: 'New'
                };
        }
    };

    // Filter documents based on search term, category, and status
    const filteredDocuments: DocumentType[] = allDocuments.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || doc.categoryId === selectedCategory;
        const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Handle category click to filter documents
    const handleCategoryClick = (categoryId: string): void => {
        setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    };

    // Handle viewing a document (opens document viewer and marks as viewed)
    const handleViewDocument = (doc: DocumentType): void => {
        setSelectedDocument(doc);
        setShowDocumentViewer(true);

        // Mark document as viewed via API if it was pending and user is available
        if (doc.status === 'pending' && user?.id) {
            documentViewMutation.mutate({
                userId: user.id,
                documentId: doc.id,
            });
        }
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

    // Handle signing a document (opens signature dialog)
    const handleSignDocument = (doc: DocumentType): void => {
        setSelectedDocument(doc);
        setShowSignatureDialog(true);
    };

    // Handle confirming signature with API call
    const handleConfirmSignature = (): void => {
        if (selectedDocument && user?.id) {
            documentCompletionMutation.mutate({
                userId: user.id,
                documentId: selectedDocument.id,
            });
        }
    };

    // Calculate pending document count
    const pendingCount: number = allDocuments.filter(doc => doc.status === 'pending' || doc.status === 'overdue').length;

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
                            disabled={documentCompletionMutation.isPending}
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

    // Loading and error states
    if (isLoading) {
        return (
            <div className="font-inter">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading your documents...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="font-inter">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading your documents</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {error instanceof Error ? error.message : 'Something went wrong'}
                        </p>
                        <Button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600 text-white">
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

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
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">My Documents</h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                View and sign your assigned documents
                                {pendingCount > 0 && (
                                    <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-xs font-medium">
                                        {pendingCount} pending signature{pendingCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <Select
                            value={filterStatus}
                            onValueChange={(value: string) => setFilterStatus(value)}
                        >
                            <SelectTrigger className="w-48 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                <SelectItem
                                    className="hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600"
                                    value="all">
                                    All Status
                                </SelectItem>
                                <SelectItem
                                    className="hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600"
                                    value="pending">
                                    Pending
                                </SelectItem>
                                <SelectItem
                                    className="hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600"
                                    value="signed">
                                    Signed
                                </SelectItem>
                                <SelectItem
                                    className="hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600"
                                    value="viewed">
                                    Viewed
                                </SelectItem>
                                <SelectItem
                                    className="hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600"
                                    value="overdue">
                                    Overdue
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div>
                {/* Document Categories */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Document Categories</h2>
                        {selectedCategory && (
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
                            >
                                Show All Categories
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {documentCategories.map((category) => (
                            <div
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group ${selectedCategory === category.id
                                    ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                            {category.name}
                                        </h3>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {category.count} document{category.count !== 1 ? 's' : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* All Documents Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedCategory
                                ? `${documentCategories.find(c => c.id === selectedCategory)?.name || 'Selected Category'} Documents`
                                : 'All Documents'
                            }
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                                ({filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'})
                            </span>
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Document Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Cycle
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Signed At
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredDocuments.map((doc) => {
                                    const statusConfig = getStatusConfig(doc.status);
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 rounded-lg flex items-center justify-center">
                                                        <FileText className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{doc.size}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-white">{doc.category}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    Monthly
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {doc.signedDate ? (
                                                        <span className="text-green-600 dark:text-green-400">
                                                            Signed {formatDate(doc.signedDate)}
                                                        </span>
                                                    ) : (
                                                        <span className={`${doc.status === 'overdue' ? 'text-red-600 dark:text-red-400 font-medium' :
                                                            'text-gray-900 dark:text-white'
                                                            }`}>
                                                            -
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewDocument(doc)}
                                                        disabled={documentViewMutation.isPending && selectedDocument?.id === doc.id}
                                                        className="p-2 text-gray-400 hover:text-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="View Document"
                                                    >
                                                        {documentViewMutation.isPending && selectedDocument?.id === doc.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadDocument(doc)}
                                                        className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    {(doc.status === 'pending' || doc.status === 'viewed' || doc.status === 'overdue') && (
                                                        <button
                                                            onClick={() => handleSignDocument(doc)}
                                                            className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                                                            title="Sign Document"
                                                        >
                                                            <PenTool className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredDocuments.length === 0 && (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No documents found
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {selectedCategory
                                        ? 'No documents match the selected category and filters.'
                                        : 'No documents assigned to you yet.'
                                    }
                                </p>
                                {(selectedCategory || searchTerm || filterStatus !== 'all') && (
                                    <button
                                        onClick={() => {
                                            setSelectedCategory(null);
                                            setSearchTerm('');
                                            setFilterStatus('all');
                                        }}
                                        className="mt-4 text-cyan-600 dark:text-cyan-400 hover:underline"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Viewer - Full Screen */}
            {showDocumentViewer && selectedDocument && (
                <DocumentViewer
                    document={selectedDocument}
                    onClose={() => {
                        setShowDocumentViewer(false);
                        setSelectedDocument(null);
                    }}
                    onSign={handleSignDocument}
                    onDownload={handleDownloadDocument}
                />
            )}

            {/* View Document Info Modal */}
            <Modal
                show={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Document Information"
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
                                    Added on {selectedDocument.createdAt} • Due: {selectedDocument.dueDate}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusConfig(selectedDocument.status).bgColor} ${getStatusConfig(selectedDocument.status).textColor}`}>
                                    {getStatusConfig(selectedDocument.status).label}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Size:</span>
                                <span className="ml-2 text-sm text-gray-900 dark:text-white">{selectedDocument.size}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                                <span className="ml-2 text-sm text-gray-900 dark:text-white">{selectedDocument.category}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Priority:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${selectedDocument.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                                    selectedDocument.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                                        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                    }`}>
                                    {selectedDocument.priority} priority
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleViewDocument(selectedDocument);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <Eye className="w-4 h-4" />
                                View Document
                            </button>
                            <button
                                onClick={() => handleDownloadDocument(selectedDocument)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            {(selectedDocument.status === 'pending' || selectedDocument.status === 'viewed' || selectedDocument.status === 'overdue') && (
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handleSignDocument(selectedDocument);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    <PenTool className="w-4 h-4" />
                                    Sign Document
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Signature Confirmation Dialog */}
            <Modal
                show={showSignatureDialog}
                onClose={() => setShowSignatureDialog(false)}
                title="Confirm Signature"
            >
                {selectedDocument && (
                    <div className="space-y-4 text-center">
                        <PenTool className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Sign "{selectedDocument.name}"?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            By clicking "Confirm Signature", you electronically sign this document. This action is legally binding.
                        </p>

                        {/* Show error if mutation failed */}
                        {documentCompletionMutation.isError && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
                                <p className="text-sm text-red-800 dark:text-red-400">
                                    {documentCompletionMutation.error?.message || 'Failed to sign document. Please try again.'}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowSignatureDialog(false)}
                                disabled={documentCompletionMutation.isPending}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSignature}
                                disabled={documentCompletionMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {documentCompletionMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Signing...
                                    </>
                                ) : (
                                    'Confirm Signature'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default EmployeeDocumentsPage;