import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

const BORDER_LEFT_MAP: Record<string, string> = {
    'bg-blue-500': 'border-l-blue-500 dark:border-l-blue-500',
    'bg-red-500': 'border-l-red-500 dark:border-l-red-500',
    'bg-green-500': 'border-l-green-500 dark:border-l-green-500',
    'bg-purple-500': 'border-l-purple-500 dark:border-l-purple-500',
    'bg-yellow-500': 'border-l-yellow-500 dark:border-l-yellow-500',
    'bg-pink-500': 'border-l-pink-500 dark:border-l-pink-500',
    'bg-indigo-500': 'border-l-indigo-500 dark:border-l-indigo-500',
    'bg-cyan-500': 'border-l-cyan-500 dark:border-l-cyan-500',
    'bg-orange-500': 'border-l-orange-500 dark:border-l-orange-500',
    'bg-teal-500': 'border-l-teal-500 dark:border-l-teal-500',
    'bg-gray-500': 'border-l-gray-500 dark:border-l-gray-500',
    'bg-emerald-500': 'border-l-emerald-500 dark:border-l-emerald-500',
    'bg-violet-500': 'border-l-violet-500 dark:border-l-violet-500',
    'bg-rose-500': 'border-l-rose-500 dark:border-l-rose-500',
    'bg-amber-500': 'border-l-amber-500 dark:border-l-amber-500',
    'bg-lime-500': 'border-l-lime-500 dark:border-l-lime-500',
    'bg-sky-500': 'border-l-sky-500 dark:border-l-sky-500',
    'bg-fuchsia-500': 'border-l-fuchsia-500 dark:border-l-fuchsia-500',
};

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
            className={`bg-white dark:bg-gray-800 rounded-xl border border-l-4 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group ${BORDER_LEFT_MAP[folder.color] ?? 'border-l-blue-500'} ${isSelected
                ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20'
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
                    className="p-1.5 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
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
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Folder"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default FolderCard;