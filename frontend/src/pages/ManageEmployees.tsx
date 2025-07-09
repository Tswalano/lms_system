import { useState } from "react";
import { Users, UserPlus, UserMinus, Edit, Search, Loader2, AlertCircle, RefreshCw, Shield, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    isAdmin: boolean;
    role: string;
}

interface AddEmployeeData {
    id?: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    isAdmin: boolean;
}

interface ApiResponse<T> {
    code: string;
    error: boolean;
    message: string;
    payload: T;
}

const ManageEmployees = () => {
    const { authFetch } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [newEmployee, setNewEmployee] = useState<AddEmployeeData>({
        firstName: "",
        lastName: "",
        jobTitle: "",
        isAdmin: false
    });
    const [editEmployee, setEditEmployee] = useState<AddEmployeeData>({
        id: "",
        firstName: "",
        lastName: "",
        jobTitle: "",
        isAdmin: false
    });

    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    // Fetch all employees
    const fetchEmployees = async (): Promise<Employee[]> => {
        if (!token) {
            throw new Error('Unauthorized');
        }

        const response = await authFetch('/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse<Employee[]> = await response.json();

        if (result.error) {
            throw new Error(result.message || 'Failed to fetch employees');
        }

        return result.payload;
    };

    const {
        data: employees = [],
        isLoading,
        error,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ['employees'],
        queryFn: fetchEmployees,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    // Update employee mutation
    const updateEmployeeMutation = useMutation({
        mutationFn: async ({ id, employeeData }: { id: string; employeeData: AddEmployeeData }): Promise<Employee> => {
            if (!token) {
                throw new Error('Unauthorized');
            }

            const response = await authFetch('/users/update-user', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    id,
                    ...employeeData
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            const result: ApiResponse<Employee> = await response.json();

            if (result.error) {
                throw new Error(result.message || 'Failed to update employee');
            }

            return result.payload;
        },
        onSuccess: (updatedEmployee) => {
            // Invalidate and refetch employees list
            queryClient.invalidateQueries({ queryKey: ['employees'] });

            // Reset form and close dialog
            setEditEmployee({
                firstName: "",
                lastName: "",
                jobTitle: "",
                isAdmin: false
            });
            setIsEditDialogOpen(false);
            setSelectedEmployee(null);

            toast("Employee Updated", {
                description: `${updatedEmployee.firstName} ${updatedEmployee.lastName} has been updated successfully.`,
            });
        },
        onError: (error) => {
            toast("Error Updating Employee", {
                description: error instanceof Error ? error.message : "Failed to update employee. Please try again.",
            });
        }
    });

    const addEmployeeMutation = useMutation({
        mutationFn: async (employeeData: AddEmployeeData): Promise<Employee> => {
            if (!token) {
                throw new Error('Unauthorized');
            }

            const response = await authFetch('/users/add-user', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    firstName: employeeData.firstName,
                    lastName: employeeData.lastName,
                    jobTitle: employeeData.jobTitle,
                    isAdmin: employeeData.isAdmin
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            const result: ApiResponse<Employee> = await response.json();

            if (result.error) {
                throw new Error(result.message || 'Failed to add employee');
            }

            return result.payload;
        },
        onSuccess: (newEmployee) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            setNewEmployee({
                firstName: "",
                lastName: "",
                jobTitle: "",
                isAdmin: false
            });
            setIsAddDialogOpen(false);

            toast.success("Employee Added", {
                description: `${newEmployee.firstName} ${newEmployee.lastName} has been added successfully.`,
            });
        },
        onError: (error) => {
            toast.error("Error Adding Employee", {
                description: error instanceof Error ? error.message : "Failed to add employee. Please try again.",
            });
        }
    });

    // Remove employee mutation
    const removeEmployeeMutation = useMutation({
        mutationFn: async (employeeId: string): Promise<void> => {
            if (!token) {
                throw new Error('Unauthorized');
            }

            const response = await authFetch('/users/delete-user', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ id: employeeId, email: selectedEmployee?.email })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }
        },
        onSuccess: () => {
            // Invalidate and refetch employees list
            queryClient.invalidateQueries({ queryKey: ['employees'] });

            // Close dialogs and reset state
            setIsDeleteDialogOpen(false);
            setSelectedEmployee(null);

            toast("Employee Removed", {
                description: `Employee has been removed from the system.`
            });
        },
        onError: (error) => {
            toast("Error Removing Employee", {
                description: error instanceof Error ? error.message : "Failed to remove employee. Please try again.",
            });
        }
    });

    const handleAddEmployee = () => {
        if (!newEmployee.firstName.trim() || !newEmployee.lastName.trim() || !newEmployee.jobTitle.trim()) {
            toast("Missing Information", {
                description: "Please fill in all required fields.",
            });
            return;
        }

        addEmployeeMutation.mutate(newEmployee);
    };

    const handleEditEmployee = () => {
        if (!editEmployee.firstName.trim() || !editEmployee.lastName.trim() || !editEmployee.jobTitle.trim()) {
            toast("Missing Information", {
                description: "Please fill in all required fields.",
            });
            return;
        }

        if (!selectedEmployee) return;

        updateEmployeeMutation.mutate({
            id: selectedEmployee.id,
            employeeData: editEmployee
        });
    };

    const handleOpenEditDialog = (employee: Employee) => {
        setSelectedEmployee(employee);
        setEditEmployee({
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            jobTitle: employee.jobTitle,
            isAdmin: employee.role === 'admin' ? true : false
        });
        setIsEditDialogOpen(true);
    };

    const handleOpenDeleteDialog = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!selectedEmployee) return;
        removeEmployeeMutation.mutate(selectedEmployee.id);
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
    };

    const filteredEmployees = employees.filter(employee => {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return fullName.includes(searchLower) ||
            employee.email.toLowerCase().includes(searchLower) ||
            employee.jobTitle.toLowerCase().includes(searchLower);
    });

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Unauthorized</h1>
                    <p className="text-gray-600 dark:text-gray-400">Please log in to manage employees.</p>
                </div>
            </div>
        );
    }

    function shortenUUID(uuid: string): string {
        if (uuid) {
            const parts = uuid.split('-');
            return `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
        return uuid;
    }


    return (
        <>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Manage Employees</h1>
                            <p className="text-gray-600 dark:text-gray-400">Add, remove, and manage employee information</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                            disabled={isFetching}
                        >
                            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Employee
                        </button>

                        {isAddDialogOpen && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                                    {/* Header */}
                                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                                    <UserPlus className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add New Employee</h3>
                                            </div>
                                            <button
                                                onClick={() => setIsAddDialogOpen(false)}
                                                className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                            >
                                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Form Content */}
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                                First Name *
                                            </label>
                                            <input
                                                id="firstName"
                                                type="text"
                                                placeholder="Enter first name"
                                                value={newEmployee.firstName}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                                                className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Last Name *
                                            </label>
                                            <input
                                                id="lastName"
                                                type="text"
                                                placeholder="Enter last name"
                                                value={newEmployee.lastName}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                                                className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Occupation *
                                            </label>
                                            <input
                                                id="jobTitle"
                                                type="text"
                                                placeholder="Enter occupation/job title"
                                                value={newEmployee.jobTitle}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, jobTitle: e.target.value })}
                                                className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2 pt-2">
                                            <input
                                                id="isAdmin"
                                                type="checkbox"
                                                checked={newEmployee.isAdmin}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, isAdmin: e.target.checked })}
                                                className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                                            />
                                            <label htmlFor="isAdmin" className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Administrator privileges
                                            </label>
                                        </div>
                                    </div>

                                    {/* Footer with action buttons */}
                                    <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleAddEmployee}
                                                disabled={addEmployeeMutation.isPending}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                            >
                                                {addEmployeeMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    'Add Employee'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setIsAddDialogOpen(false)}
                                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Employee Dialog */}
                        {isEditDialogOpen && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                                    {/* Header with gradient */}
                                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                    Edit Employee
                                                    <span className="block text-sm font-normal text-gray-600 dark:text-gray-400">
                                                        ID: {shortenUUID(selectedEmployee?.id || '')}
                                                    </span>
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => setIsEditDialogOpen(false)}
                                                className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                            >
                                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Form Content */}
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <label htmlFor="editFirstName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                                First Name *
                                            </label>
                                            <input
                                                id="editFirstName"
                                                type="text"
                                                placeholder="Enter first name"
                                                value={editEmployee.firstName}
                                                onChange={(e) => setEditEmployee({ ...editEmployee, firstName: e.target.value })}
                                                className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="editLastName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Last Name *
                                            </label>
                                            <input
                                                id="editLastName"
                                                type="text"
                                                placeholder="Enter last name"
                                                value={editEmployee.lastName}
                                                onChange={(e) => setEditEmployee({ ...editEmployee, lastName: e.target.value })}
                                                className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="editJobTitle" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Occupation *
                                            </label>
                                            <input
                                                id="editJobTitle"
                                                type="text"
                                                placeholder="Enter job title"
                                                value={editEmployee.jobTitle}
                                                onChange={(e) => setEditEmployee({ ...editEmployee, jobTitle: e.target.value })}
                                                className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2 pt-2">
                                            <input
                                                id="editIsAdmin"
                                                type="checkbox"
                                                checked={editEmployee.isAdmin}
                                                onChange={(e) => setEditEmployee({ ...editEmployee, isAdmin: e.target.checked })}
                                                className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                                            />
                                            <label htmlFor="editIsAdmin" className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Administrator privileges
                                            </label>
                                        </div>
                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleEditEmployee}
                                                disabled={updateEmployeeMutation.isPending}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                            >
                                                {updateEmployeeMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    'Update Employee'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setIsEditDialogOpen(false)}
                                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delete Confirmation Dialog */}
                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                Delete Employee
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Are you sure you want to remove{" "}
                                                <span className="font-medium">
                                                    {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                                                </span>
                                                ? This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            onClick={handleConfirmDelete}
                                            variant="destructive"
                                            className="flex-1"
                                            disabled={removeEmployeeMutation.isPending}
                                        >
                                            {removeEmployeeMutation.isPending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Removing...
                                                </>
                                            ) : (
                                                'Delete Employee'
                                            )}
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search employees by name, email, or occupation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading employees</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {error instanceof Error ? error.message : 'Something went wrong'}
                            </p>
                            <Button
                                onClick={() => refetch()}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">No employees found</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {searchTerm ? 'Try adjusting your search criteria.' : 'Add your first employee to get started.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-100 dark:border-slate-700">
                                <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Occupation</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Role</TableHead>
                                {/* <TableHead className="text-gray-700 dark:text-gray-300">Join Date</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead> */}
                                <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map((employee) => (
                                <TableRow key={employee.id} className="border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <TableCell>
                                        <div>
                                            <div className="font-medium text-gray-800 dark:text-gray-200">
                                                {employee.firstName} {employee.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">{employee.jobTitle}</TableCell>
                                    <TableCell>
                                        {employee.role === 'admin' ? (
                                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1 w-fit">
                                                <Shield className="w-3 h-3" />
                                                Admin
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 flex items-center gap-1 w-fit">
                                                <User className="w-3 h-3" />
                                                Employee
                                            </Badge>
                                        )}
                                    </TableCell>
                                    {/* <TableCell className="text-gray-600 dark:text-gray-400">
                                                    {new Date(employee.joinDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                                                        active
                                                    </span>
                                                </TableCell> */}
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900"
                                                onClick={() => handleOpenEditDialog(employee)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                                                onClick={() => handleOpenDeleteDialog(employee)}
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </>
    );
};

export default ManageEmployees;