import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FolderPlus, Loader2, AlertCircle, Folder } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import CreateFolderModal from './CreateFolderModal';
import ConfirmationModal from '../ConfirmationModal';
import FolderCard from './FolderCard';

interface Department {
    id: number;
    name: string;
    description?: string;
}

interface FolderType {
    id: number;
    name: string;
    departmentId?: number;
    color: string;
    department?: string;
    fileCount?: number;
    totalSize?: string;
    icon?: React.ElementType;
    description?: string;
}

interface NewFolderState {
    name: string;
    departmentId: number;
    color: string;
}

interface FolderManagerProps {
    folders: FolderType[];
    departments: Department[];
    selectedFolder: string | null;
    onFolderClick: (folderId: string) => void;
    onFolderSelect: (folderId: string | null) => void;
    onFolderCreated: (folder: FolderType) => void;
    onFolderUpdated: (folder: FolderType) => void;
    onFolderDeleted: (folderId: number) => void;
    isLoading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
    hideCreateButton?: boolean;
}

const FolderManager: React.FC<FolderManagerProps> = ({
    folders,
    departments,
    selectedFolder,
    onFolderClick,
    onFolderSelect,
    onFolderCreated,
    onFolderUpdated,
    onFolderDeleted,
    isLoading = false,
    error = null,
    onRetry,
    hideCreateButton = false
}) => {
    const { authFetch } = useAuth();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
    const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);

    // Helper function to get department name
    const getDepartmentName = (departmentId?: number): string => {
        if (!departmentId) return 'No Department';
        const department = departments.find(dept => dept.id === departmentId);
        return department ? department.name : 'Unknown Department';
    };

    // Create folder mutation
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
        onSuccess: (response) => {
            const folder: FolderType = {
                id: response.payload?.id || response.id,
                name: response.payload?.name || response.name,
                color: response.payload?.color || response.color,
                departmentId: response.payload?.departmentId || response.departmentId,
                department: getDepartmentName(response.payload?.departmentId || response.departmentId),
                fileCount: 0,
                totalSize: '0 MB',
                icon: Folder
            };

            onFolderCreated(folder);
            setShowCreateModal(false);

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

    // Update folder mutation
    const updateFolderMutation = useMutation({
        mutationFn: async ({ id, ...folderData }: { id: number } & Partial<NewFolderState>) => {
            const response = await authFetch(`/admin-docs/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ ...folderData })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            return response.json();
        },
        onSuccess: (_, variables) => {
            if (editingFolder) {
                const updatedFolder: FolderType = {
                    ...editingFolder,
                    name: variables.name || editingFolder.name,
                    color: variables.color || editingFolder.color,
                    departmentId: variables.departmentId !== undefined ? variables.departmentId : editingFolder.departmentId,
                    department: getDepartmentName(variables.departmentId !== undefined ? variables.departmentId : editingFolder.departmentId)
                };
                onFolderUpdated(updatedFolder);
            }
            setShowEditModal(false);
            setEditingFolder(null);

            toast.success("Folder updated successfully!", {
                description: `Folder has been updated.`,
            });
        },
        onError: (error: Error) => {
            toast.error("Error updating folder", {
                description: error.message || "Failed to update folder. Please try again.",
            });
        }
    });

    // Delete folder mutation
    const deleteFolderMutation = useMutation({
        mutationFn: async (folderId: number) => {
            const response = await authFetch(`/admin-docs/categories/${folderId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            return response.json();
        },
        onSuccess: (_, folderId) => {
            onFolderDeleted(folderId);
            setShowDeleteModal(false);
            setDeletingFolder(null);

            toast.success("Folder deleted successfully!", {
                description: "Folder has been removed.",
            });
        },
        onError: (error: Error) => {
            toast.error("Error deleting folder", {
                description: error.message || "Failed to delete folder. Please try again.",
            });
        }
    });

    // Event handlers
    const handleCreateFolder = (folderData: NewFolderState) => {
        createFolderMutation.mutate(folderData);
    };

    const handleEditFolder = (folder: FolderType) => {
        console.log("editing folder", folder);
        setEditingFolder(folder);
        setShowEditModal(true);
    };

    const handleUpdateFolder = (folderData: NewFolderState) => {
        if (!editingFolder?.id) return;
        updateFolderMutation.mutate({
            id: editingFolder.id,
            ...folderData,
        });
    };

    const handleDeleteFolder = (folder: FolderType) => {
        setDeletingFolder(folder);
        setShowDeleteModal(true);
    };

    const confirmDeleteFolder = () => {
        if (!deletingFolder?.id) return;
        deleteFolderMutation.mutate(deletingFolder.id);
    };
    // debugger
    // Transform folders to include missing properties
    const transformedFolders = folders.map(folder => ({
        ...folder,
        department: departments.find(dept => dept.id === folder.departmentId)?.name || 'Unknown Department',
        fileCount: folder.fileCount || 0,
        size: folder.totalSize || '0 MB',
        icon: folder.icon || Folder
    }));

    return (
        <>
            {/* Loading and Error States */}
            {isLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12 mb-8">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading folders and departments...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12 mb-8">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading data</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {error instanceof Error ? error.message : 'Something went wrong while loading folders and departments'}
                        </p>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Folders Section */}
                    {transformedFolders.length > 0 ? (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Folders</h2>
                                <div className="flex gap-2">
                                    {!hideCreateButton && (
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            <FolderPlus className="w-4 h-4" />
                                            New Folder
                                        </button>
                                    )}
                                    {selectedFolder && (
                                        <button
                                            onClick={() => onFolderSelect(null)}
                                            className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
                                        >
                                            Show All Documents
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {transformedFolders.map((folder) => (
                                    <FolderCard
                                        key={folder.id}
                                        folder={folder}
                                        isSelected={selectedFolder === folder.name} // Compare by name since selectedFolder is folder name
                                        onClick={() => onFolderClick(folder.name)} // Pass folder name
                                        onEdit={() => handleEditFolder(folder)}
                                        onDelete={() => handleDeleteFolder(folder)}
                                        isDeleting={deleteFolderMutation.isPending && deletingFolder?.id === folder.id}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        // No folders available
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center mb-8">
                            <div className="mb-4">
                                <FolderPlus className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No Folders Available</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Create a new folder to organize your documents.
                                </p>
                                {!hideCreateButton && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                                    >
                                        <FolderPlus className="w-4 h-4" />
                                        New Folder
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateFolder}
                departments={departments}
                isLoading={createFolderMutation.isPending}
                title="Add New Folder"
                submitText="Add Folder"
            />

            {/* Edit Folder Modal */}
            <CreateFolderModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingFolder(null);
                }}
                onSubmit={handleUpdateFolder}
                departments={departments}
                isLoading={updateFolderMutation.isPending}
                initialData={editingFolder ? {
                    name: editingFolder.name,
                    departmentId: editingFolder.departmentId || 0,
                    color: editingFolder.color
                } : undefined}
                title="Edit Folder"
                submitText="Update Folder"
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeletingFolder(null);
                }}
                onConfirm={confirmDeleteFolder}
                title="Delete Folder"
                message={`Are you sure you want to delete the folder "${deletingFolder?.name}"? This action cannot be undone and will remove all documents in this folder.`}
                confirmText="Delete Folder"
                cancelText="Cancel"
                isLoading={deleteFolderMutation.isPending}
                type="danger"
            />
        </>
    );
};

export default FolderManager;