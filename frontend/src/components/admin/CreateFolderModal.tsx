import React, { useState, useEffect } from 'react';
import { X, Loader2, FolderPlus } from 'lucide-react';
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

interface Department {
    id: number;
    name: string;
    description?: string;
}

interface NewFolderState {
    name: string;
    departmentId: number;
    color: string;
}

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (folderData: NewFolderState) => void;
    departments: Department[];
    isLoading?: boolean;
    initialData?: Partial<NewFolderState>;
    title?: string;
    submitText?: string;
}

const folderColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-yellow-500'
];

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    departments,
    isLoading = false,
    initialData = {},
    title = "Add New Folder",
    submitText = "Add Folder"
}) => {
    const [folderData, setFolderData] = useState<NewFolderState>({
        name: '',
        departmentId: departments.length > 0 ? departments[0].id : 0,
        color: 'bg-blue-500'
    });

    // Update form data when initialData changes (for edit mode)
    useEffect(() => {
        if (isOpen) {
            setFolderData({
                name: initialData.name || '',
                departmentId: initialData.departmentId || (departments.length > 0 ? departments[0].id : 0),
                color: initialData.color || 'bg-blue-500'
            });
        }
    }, [isOpen, departments]);

    const handleSubmit = () => {
        if (!folderData.name.trim()) {
            return;
        }

        // Ensure we have a valid departmentId
        const validDepartmentId = folderData.departmentId || (departments.length > 0 ? departments[0].id : 0);

        onSubmit({
            ...folderData,
            departmentId: validDepartmentId,
            name: folderData.name.trim()
        });
    };

    const handleClose = () => {
        // Reset form to initial state
        setFolderData({
            name: '',
            departmentId: departments.length > 0 ? departments[0].id : 0,
            color: 'bg-blue-500'
        });
        onClose();
    };

    const handleDepartmentChange = (value: string) => {
        const departmentId = parseInt(value);
        setFolderData(prev => ({
            ...prev,
            departmentId: departmentId
        }));
    };

    const handleColorChange = (color: string) => {
        setFolderData(prev => ({ ...prev, color }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <FolderPlus className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </Button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                            Folder Name *
                        </Label>
                        <Input
                            id="folder-name"
                            type="text"
                            placeholder="Enter folder name"
                            value={folderData.name}
                            onChange={(e) => setFolderData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                            Department
                        </Label>
                        <Select
                            value={folderData.departmentId?.toString() || 'none'}
                            onValueChange={handleDepartmentChange}
                        >
                            <SelectTrigger id="department" className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
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
                                    onClick={() => handleColorChange(color)}
                                    className={`w-10 h-10 rounded-lg ${color} ${folderData.color === color ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-800' : ''
                                        } hover:scale-110 transition-transform`}
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
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!folderData.name.trim() || isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                submitText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateFolderModal;