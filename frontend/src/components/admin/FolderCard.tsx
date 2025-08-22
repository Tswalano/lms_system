import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

interface FolderType {
    id: number;
    name: string;
    departmentId?: number;
    color: string;
    department?: string;
    fileCount?: number;
    size?: string;
    icon: React.ElementType;
    description?: string;
}

interface FolderCardProps {
    folder: FolderType;
    isSelected: boolean;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting?: boolean;
}

const FolderCard: React.FC<FolderCardProps> = ({
    folder,
    isSelected,
    onClick,
    onEdit,
    onDelete,
    isDeleting = false
}) => {
    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group ${isSelected
                ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                : 'border-gray-200 dark:border-gray-700'
                }`}
        >
            <div onClick={onClick}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${folder.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <folder.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {folder.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {folder.department}
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{folder.fileCount} Files</span>
                    <span>{folder.size}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded"
                    title="Edit Folder"
                >
                    <Edit3 className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    disabled={isDeleting}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded disabled:opacity-50"
                    title="Delete Folder"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default FolderCard;