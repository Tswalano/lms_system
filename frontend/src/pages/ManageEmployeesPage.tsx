import { useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { Users, Building2, UserPlus, Plus, Edit, Search, Loader2, AlertCircle, RefreshCw, Shield, User, Trash2, X, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationModal from "@/components/ConfirmationModal";

// Employee Interfaces
interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dob: string;
    jobTitle: string;
    departmentId: number | null;
    department: string | null;
    isAdmin: boolean;
    role: string;
}

interface AddEmployeeData {
    id?: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    isAdmin: boolean;
    departmentId: string;
}

// Department Interfaces
interface Department {
    id: number;
    name: string;
    description: string;
    employeeCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface AddDepartmentData {
    id?: number;
    name: string;
    description: string;
}

// API Response Interfaces
interface EmployeeApiResponse<T> {
    code: string;
    error: boolean;
    message: string;
    payload: {
        users: T;
        departments?: Department[];
    };
}

interface DepartmentApiResponse<T> {
    code: string;
    error: boolean;
    message: string;
    payload: T;
}

interface UpdateApiResponse<T> {
    code: string;
    error: boolean;
    message: string;
    payload: T;
}

const ManageEmployeesPage = () => {
    const { authFetch } = useAuth();
    const [activeTab, setActiveTab] = useState("employees");
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");

    // Employee states
    const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
    const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = useState(false);
    const [isDeleteEmployeeDialogOpen, setIsDeleteEmployeeDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [newEmployee, setNewEmployee] = useState<AddEmployeeData>({
        firstName: "",
        lastName: "",
        jobTitle: "",
        departmentId: "",
        isAdmin: false
    });
    const [editEmployee, setEditEmployee] = useState<AddEmployeeData>({
        id: "",
        firstName: "",
        lastName: "",
        jobTitle: "",
        departmentId: "",
        isAdmin: false
    });

    // Department states
    const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] = useState(false);
    const [isEditDepartmentDialogOpen, setIsEditDepartmentDialogOpen] = useState(false);
    const [isDeleteDepartmentDialogOpen, setIsDeleteDepartmentDialogOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [newDepartment, setNewDepartment] = useState<AddDepartmentData>({
        name: "",
        description: ""
    });
    const [editDepartment, setEditDepartment] = useState<AddDepartmentData>({
        id: 0,
        name: "",
        description: ""
    });

    const [departments, setDepartments] = useState<Department[]>([]);
    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    // Fetch employees
    const fetchEmployees = async (): Promise<Employee[]> => {
        if (!token) throw new Error('Unauthorized');

        const response = await authFetch('/users', { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result: EmployeeApiResponse<Employee[]> = await response.json();
        if (result.error) throw new Error(result.message || 'Failed to fetch employees');

        if (result.payload.departments) {
            setDepartments(result.payload.departments);
        }

        return result.payload.users;
    };

    // Fetch departments
    const fetchDepartments = async (): Promise<Department[]> => {
        if (!token) throw new Error('Unauthorized');

        const response = await authFetch('/admin-docs/departments', {
            method: 'GET',
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result: DepartmentApiResponse<Department[]> = await response.json();
        if (result.error) throw new Error(result.message || 'Failed to fetch departments');

        return result.payload;
    };

    // React Query hooks
    const {
        data: employees = [],
        isLoading: employeesLoading,
        error: employeesError,
        refetch: refetchEmployees,
        isFetching: employeesFetching
    } = useQuery({
        queryKey: ['employees'],
        queryFn: fetchEmployees,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    const {
        data: departmentsData = [],
        isLoading: departmentsLoading,
        error: departmentsError,
        refetch: refetchDepartments,
        isFetching: departmentsFetching
    } = useQuery({
        queryKey: ['departments'],
        queryFn: fetchDepartments,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    // Helper functions
    const getDepartmentName = (departmentId: number | null, fallbackName: string | null) => {
        if (fallbackName) return fallbackName;
        if (!departmentId) return 'No Department';
        const department = departments.find(dept => dept.id === departmentId);
        return department?.name || 'Unknown Department';
    };

    const shortenUUID = (uuid: string): string => {
        if (uuid) {
            const parts = uuid.split('-');
            return `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
        return uuid;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Employee mutations
    const addEmployeeMutation = useMutation({
        mutationFn: async (employeeData: AddEmployeeData): Promise<Employee> => {
            if (!token) throw new Error('Unauthorized');

            const response = await authFetch('/users/add-user', {
                method: 'POST',
                body: JSON.stringify({
                    firstName: employeeData.firstName,
                    lastName: employeeData.lastName,
                    jobTitle: employeeData.jobTitle,
                    isAdmin: employeeData.isAdmin,
                    departmentId: employeeData.departmentId && employeeData.departmentId !== "" ? Number(employeeData.departmentId) : null
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            const result: EmployeeApiResponse<Employee> = await response.json();
            if (result.error) throw new Error(result.message || 'Failed to add employee');

            return result.payload.users;
        },
        onSuccess: (newEmployee) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            setNewEmployee({ firstName: "", lastName: "", departmentId: "", jobTitle: "", isAdmin: false });
            setIsAddEmployeeDialogOpen(false);
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

    const updateEmployeeMutation = useMutation({
        mutationFn: async ({ id, employeeData }: { id: string; employeeData: AddEmployeeData }): Promise<Employee> => {
            if (!token) throw new Error('Unauthorized');

            const response = await authFetch('/users/update-user', {
                method: 'POST',
                body: JSON.stringify({
                    id,
                    ...employeeData,
                    departmentId: employeeData.departmentId ? Number(employeeData.departmentId) : null
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            const result: UpdateApiResponse<Employee> = await response.json();
            if (result.error) throw new Error(result.message || 'Failed to update employee');

            return result.payload;
        },
        onSuccess: (updatedEmployee) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            setEditEmployee({ firstName: "", lastName: "", jobTitle: "", departmentId: "", isAdmin: false });
            setIsEditEmployeeDialogOpen(false);
            setSelectedEmployee(null);
            toast.success("Employee Updated", {
                description: `${updatedEmployee.firstName} ${updatedEmployee.lastName} has been updated successfully.`,
            });
        },
        onError: (error) => {
            toast.error("Error Updating Employee", {
                description: error instanceof Error ? error.message : "Failed to update employee. Please try again.",
            });
        }
    });

    const removeEmployeeMutation = useMutation({
        mutationFn: async (employeeId: string): Promise<void> => {
            if (!token) throw new Error('Unauthorized');
            if (!selectedEmployee) throw new Error('No employee selected for deletion');

            const response = await authFetch('/users/delete-user', {
                method: 'DELETE',
                body: JSON.stringify({ id: employeeId })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            setIsDeleteEmployeeDialogOpen(false);
            setSelectedEmployee(null);
            toast.success("Employee Deactivated", {
                description: `Employee has been marked inactive and removed from the active employee list.`
            });
        },
        onError: (error) => {
            toast.error("Error Deactivating Employee", {
                description: error instanceof Error ? error.message : "Failed to deactivate employee. Please try again.",
            });
        }
    });

    // Department mutations
    const addDepartmentMutation = useMutation({
        mutationFn: async (departmentData: AddDepartmentData): Promise<Department> => {
            if (!token) throw new Error('Unauthorized');

            const response = await authFetch('/admin-docs/departments', {
                method: 'POST',
                body: JSON.stringify({
                    name: departmentData.name,
                    description: departmentData.description
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            const result: DepartmentApiResponse<Department> = await response.json();
            if (result.error) throw new Error(result.message || 'Failed to add department');

            return result.payload;
        },
        onSuccess: (newDepartment) => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            setNewDepartment({ name: "", description: "" });
            setIsAddDepartmentDialogOpen(false);
            toast.success("Department Added", {
                description: `${newDepartment.name} has been added successfully.`,
            });
        },
        onError: (error) => {
            toast.error("Error Adding Department", {
                description: error instanceof Error ? error.message : "Failed to add department. Please try again.",
            });
        }
    });

    const updateDepartmentMutation = useMutation({
        mutationFn: async ({ id, departmentData }: { id: number; departmentData: AddDepartmentData }): Promise<Department> => {
            if (!token) throw new Error('Unauthorized');

            const response = await authFetch(`/admin-docs/departments/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: departmentData.name,
                    description: departmentData.description
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            const result: DepartmentApiResponse<Department> = await response.json();
            if (result.error) throw new Error(result.message || 'Failed to update department');

            return result.payload;
        },
        onSuccess: (updatedDepartment) => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            setEditDepartment({ name: "", description: "" });
            setIsEditDepartmentDialogOpen(false);
            setSelectedDepartment(null);
            toast.success("Department Updated", {
                description: `${updatedDepartment.name} has been updated successfully.`,
            });
        },
        onError: (error) => {
            toast.error("Error Updating Department", {
                description: error instanceof Error ? error.message : "Failed to update department. Please try again.",
            });
        }
    });

    const deleteDepartmentMutation = useMutation({
        mutationFn: async (departmentId: number): Promise<void> => {
            if (!token) throw new Error('Unauthorized');

            const response = await authFetch(`/admin-docs/departments/${departmentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            setIsDeleteDepartmentDialogOpen(false);
            setSelectedDepartment(null);
            toast.success("Department Deleted", {
                description: "Department has been removed from the system."
            });
        },
        onError: (error) => {
            toast.error("Error Deleting Department", {
                description: error instanceof Error ? error.message : "Failed to delete department. Please try again.",
            });
        }
    });

    // Event handlers
    const handleAddEmployee = () => {
        if (!newEmployee.firstName.trim() || !newEmployee.lastName.trim() || !newEmployee.jobTitle.trim()) {
            toast.error("Missing Information", {
                description: "Please fill in all required fields.",
            });
            return;
        }
        addEmployeeMutation.mutate(newEmployee);
    };

    const handleEditEmployee = () => {
        if (!editEmployee.firstName.trim() || !editEmployee.lastName.trim() || !editEmployee.jobTitle.trim()) {
            toast.error("Missing Information", {
                description: "Please fill in all required fields.",
            });
            return;
        }
        if (!selectedEmployee) return;
        updateEmployeeMutation.mutate({ id: selectedEmployee.id, employeeData: editEmployee });
    };

    const handleOpenEditEmployeeDialog = (employee: Employee) => {
        setSelectedEmployee(employee);
        setEditEmployee({
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            jobTitle: employee.jobTitle,
            departmentId: (employee.departmentId || employee.departmentId)?.toString() || "",
            isAdmin: employee.role === 'admin' ? true : false
        });
        setIsEditEmployeeDialogOpen(true);
    };

    const handleOpenDeleteEmployeeDialog = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsDeleteEmployeeDialogOpen(true);
    };

    const handleConfirmDeleteEmployee = () => {
        if (!selectedEmployee) return;
        removeEmployeeMutation.mutate(selectedEmployee.id);
    };

    const handleAddDepartment = () => {
        if (!newDepartment.name.trim()) {
            toast.error("Missing Information", {
                description: "Department name is required.",
            });
            return;
        }
        addDepartmentMutation.mutate(newDepartment);
    };

    const handleEditDepartment = () => {
        if (!editDepartment.name.trim()) {
            toast.error("Missing Information", {
                description: "Department name is required.",
            });
            return;
        }
        if (!selectedDepartment) return;
        updateDepartmentMutation.mutate({ id: selectedDepartment.id, departmentData: editDepartment });
    };

    const handleOpenEditDepartmentDialog = (department: Department) => {
        setSelectedDepartment(department);
        setEditDepartment({
            id: department.id,
            name: department.name,
            description: department.description
        });
        setIsEditDepartmentDialogOpen(true);
    };

    const handleOpenDeleteDepartmentDialog = (department: Department) => {
        setSelectedDepartment(department);
        setIsDeleteDepartmentDialogOpen(true);
    };

    const handleConfirmDeleteDepartment = () => {
        if (!selectedDepartment) return;
        deleteDepartmentMutation.mutate(selectedDepartment.id);
    };

    const handleRefresh = () => {
        if (activeTab === "employees") {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        } else {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        }
    };

    // Filter functions
    const filteredEmployees = employees.filter(employee => {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        const departmentName = getDepartmentName(employee.departmentId || employee.departmentId, employee.department).toLowerCase();

        return fullName.includes(searchLower) ||
            employee.email.toLowerCase().includes(searchLower) ||
            employee.jobTitle.toLowerCase().includes(searchLower) ||
            departmentName.includes(searchLower);
    });

    const filteredDepartments = departmentsData.filter(department => {
        const searchLower = departmentSearchTerm.toLowerCase();
        return department.name.toLowerCase().includes(searchLower) ||
            department.description.toLowerCase().includes(searchLower);
    });

    const employeesPagination = usePagination(filteredEmployees, 10);
    const departmentsPagination = usePagination(filteredDepartments, 10);

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Unauthorized</h1>
                    <p className="text-gray-600 dark:text-gray-400">Please log in to manage employees and departments.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Manage Team</h1>
                            <p className="text-gray-600 dark:text-gray-400">Manage employees and departments in one place</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                            disabled={employeesFetching || departmentsFetching}
                        >
                            <RefreshCw className={`w-4 h-4 ${(employeesFetching || departmentsFetching) ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        {activeTab === "employees" ? (
                            <button
                                onClick={() => setIsAddEmployeeDialogOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Employee
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsAddDepartmentDialogOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Department
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 dark:bg-slate-800">
                    <TabsTrigger
                        value="employees"
                        className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                    >
                        <Users className="w-4 h-4" />
                        Employees
                    </TabsTrigger>
                    <TabsTrigger
                        value="departments"
                        className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                    >
                        <Building2 className="w-4 h-4" />
                        Departments
                    </TabsTrigger>
                </TabsList>

                {/* Employees Tab */}
                <TabsContent value="employees" className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search employees by name, email, occupation, or department..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); employeesPagination.resetPage(); }}
                            className="pl-10 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        {employeesLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
                                </div>
                            </div>
                        ) : employeesError ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading employees</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        {employeesError instanceof Error ? employeesError.message : 'Something went wrong'}
                                    </p>
                                    <Button onClick={() => refetchEmployees()} className="bg-blue-500 hover:bg-blue-600 text-white">
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
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-100 dark:border-slate-700">
                                            <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-300">Date of Birth</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-300">Occupation</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-300">Department</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-300">Role</TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employeesPagination.paginatedItems.map((employee) => (
                                            <TableRow key={employee.id} className="border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">
                                                            {employee.firstName} {employee.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-600 dark:text-gray-400">{formatDate(employee.dob)}</TableCell>
                                                <TableCell className="text-gray-600 dark:text-gray-400">{employee.jobTitle}</TableCell>
                                                <TableCell className="text-gray-600 dark:text-gray-400">
                                                    {getDepartmentName(employee.departmentId || employee.departmentId, employee.department)}
                                                </TableCell>
                                                <TableCell>
                                                    {employee.role === 'admin' ? (
                                                        <Badge className="bg-green-100 text-green-600 dark:bg-green-700 dark:text-green-200 flex items-center gap-1 w-fit">
                                                            <Shield className="w-3 h-3" />
                                                            Admin
                                                        </Badge>
                                                    ) : employee.role === 'manager' ? (
                                                        <Badge className="bg-blue-100 text-blue-600 dark:bg-blue-700 dark:text-blue-200 flex items-center gap-1 w-fit">
                                                            <User className="w-3 h-3" />
                                                            Manager
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200 flex items-center gap-1 w-fit">
                                                            <User className="w-3 h-3" />
                                                            Employee
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                                                            onClick={() => handleOpenEditEmployeeDialog(employee)}
                                                        >
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            <span className="text-sm font-medium">Edit</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                                            onClick={() => handleOpenDeleteEmployeeDialog(employee)}
                                                        >
                                                            <UserMinus className="w-4 h-4 mr-1" />
                                                            <span className="text-sm font-medium">Delete</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination
                                    currentPage={employeesPagination.page}
                                    totalPages={employeesPagination.totalPages}
                                    pageSize={employeesPagination.pageSize}
                                    totalItems={employeesPagination.totalItems}
                                    onPageChange={employeesPagination.setPage}
                                    onPageSizeChange={employeesPagination.setPageSize}
                                />
                            </>
                        )}
                    </div>
                </TabsContent>

                {/* Departments Tab */}
                <TabsContent value="departments" className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search departments by name or description..."
                            value={departmentSearchTerm}
                            onChange={(e) => { setDepartmentSearchTerm(e.target.value); departmentsPagination.resetPage(); }}
                            className="pl-10 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        {departmentsLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">Loading departments...</p>
                                </div>
                            </div>
                        ) : departmentsError ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading departments</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        {departmentsError instanceof Error ? departmentsError.message : 'Something went wrong'}
                                    </p>
                                    <Button onClick={() => refetchDepartments()} className="bg-blue-500 hover:bg-blue-600 text-white">
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        ) : filteredDepartments.length === 0 ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">No departments found</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {departmentSearchTerm ? 'Try adjusting your search criteria.' : 'Add your first department to get started.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-100 dark:border-slate-700">
                                            <TableHead className="text-gray-700 dark:text-gray-300">Department</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-300">Employees</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-300">Created</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-300">Last Updated</TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {departmentsPagination.paginatedItems.map((department) => (
                                            <TableRow key={department.id} className="border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">
                                                            {department.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                                                            {department.description || 'No description'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-100 text-blue-600 dark:bg-blue-700 dark:text-blue-200 flex items-center gap-1 w-fit">
                                                        <Users className="w-3 h-3" />
                                                        {employees.filter(emp => emp.departmentId === department.id).length}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-600 dark:text-gray-400">
                                                    {department.createdAt ? formatDate(department.createdAt) : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-gray-600 dark:text-gray-400">
                                                    {department.updatedAt ? formatDate(department.updatedAt) : 'N/A'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                                                            onClick={() => handleOpenEditDepartmentDialog(department)}
                                                        >
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            <span className="text-sm font-medium">Edit</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                                            onClick={() => handleOpenDeleteDepartmentDialog(department)}
                                                            disabled={employees.filter(emp => emp.departmentId === department.id).length > 0}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            <span className="text-sm font-medium">Delete</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination
                                    currentPage={departmentsPagination.page}
                                    totalPages={departmentsPagination.totalPages}
                                    pageSize={departmentsPagination.pageSize}
                                    totalItems={departmentsPagination.totalItems}
                                    onPageChange={departmentsPagination.setPage}
                                    onPageSizeChange={departmentsPagination.setPageSize}
                                />
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Add Employee Dialog */}
            {isAddEmployeeDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                        <UserPlus className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add New Employee</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsAddEmployeeDialogOpen(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    First Name *
                                </Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="Enter first name"
                                    value={newEmployee.firstName}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Last Name *
                                </Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Enter last name"
                                    value={newEmployee.lastName}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jobTitle" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Occupation *
                                </Label>
                                <Input
                                    id="jobTitle"
                                    type="text"
                                    placeholder="Enter occupation/job title"
                                    value={newEmployee.jobTitle}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, jobTitle: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="addDepartment" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Department
                                </Label>
                                <Select
                                    value={newEmployee.departmentId || "none"}
                                    onValueChange={(value: string) => setNewEmployee({ ...newEmployee, departmentId: value === "none" ? "" : value })}
                                >
                                    <SelectTrigger id='addDepartment' className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        <SelectItem
                                            className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                            value="none">
                                            No Department
                                        </SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem
                                                className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                                key={department.id}
                                                value={department.id.toString()}>
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Label htmlFor="isAdminAdd" className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                                    <Checkbox
                                        id="isAdminAdd"
                                        checked={newEmployee.isAdmin}
                                        onCheckedChange={(checked) => setNewEmployee({ ...newEmployee, isAdmin: checked ? true : false })}
                                        className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                Administrator Privileges
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                            Grant this user admin access to manage employees, departments, and system settings.
                                        </p>
                                    </div>
                                </Label>
                            </div>
                        </div>

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
                                    onClick={() => setIsAddEmployeeDialogOpen(false)}
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
            {isEditEmployeeDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
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
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditEmployeeDialogOpen(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editFirstName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    First Name *
                                </Label>
                                <Input
                                    id="editFirstName"
                                    type="text"
                                    placeholder="Enter first name"
                                    value={editEmployee.firstName}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, firstName: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editLastName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Last Name *
                                </Label>
                                <Input
                                    id="editLastName"
                                    type="text"
                                    placeholder="Enter last name"
                                    value={editEmployee.lastName}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, lastName: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editJobTitle" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Occupation *
                                </Label>
                                <Input
                                    id="editJobTitle"
                                    type="text"
                                    placeholder="Enter job title"
                                    value={editEmployee.jobTitle}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, jobTitle: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editDepartment" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Department
                                </Label>
                                <Select
                                    value={editEmployee.departmentId || "none"}
                                    onValueChange={(value: string) => setEditEmployee({ ...editEmployee, departmentId: value === "none" ? "" : value })}
                                >
                                    <SelectTrigger id='editDepartment' className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        <SelectItem
                                            className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                            value="none">
                                            No Department
                                        </SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem
                                                className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                                key={department.id}
                                                value={department.id.toString()}>
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Label htmlFor="isAdminEdit" className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                                    <Checkbox
                                        id="isAdminEdit"
                                        checked={editEmployee.isAdmin}
                                        onCheckedChange={(checked) => setEditEmployee({ ...editEmployee, isAdmin: checked ? true : false })}
                                        className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                Administrator Privileges
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                            Grant this user admin access to manage employees, departments, and system settings.
                                        </p>
                                    </div>
                                </Label>
                            </div>
                        </div>

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
                                    onClick={() => setIsEditEmployeeDialogOpen(false)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Department Dialog */}
            {isAddDepartmentDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add New Department</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsAddDepartmentDialogOpen(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="deptName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Department Name *
                                </Label>
                                <Input
                                    id="deptName"
                                    type="text"
                                    placeholder="Enter department name"
                                    value={newDepartment.name}
                                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deptDesc" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Description
                                </Label>
                                <Textarea
                                    id="deptDesc"
                                    placeholder="Enter department description"
                                    value={newDepartment.description}
                                    onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddDepartment}
                                    disabled={addDepartmentMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {addDepartmentMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Department'
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsAddDepartmentDialogOpen(false)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Department Dialog */}
            {isEditDepartmentDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <Edit className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                        Edit Department
                                        <span className="block text-sm font-normal text-gray-600 dark:text-gray-400">
                                            ID: {selectedDepartment?.id}
                                        </span>
                                    </h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditDepartmentDialogOpen(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editDeptName" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Department Name *
                                </Label>
                                <Input
                                    id="editDeptName"
                                    type="text"
                                    placeholder="Enter department name"
                                    value={editDepartment.name}
                                    onChange={(e) => setEditDepartment({ ...editDepartment, name: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editDeptDesc" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Description
                                </Label>
                                <Textarea
                                    id="editDeptDesc"
                                    placeholder="Enter department description"
                                    value={editDepartment.description}
                                    onChange={(e) => setEditDepartment({ ...editDepartment, description: e.target.value })}
                                    className="w-full px-3 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleEditDepartment}
                                    disabled={updateDepartmentMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {updateDepartmentMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Department'
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsEditDepartmentDialogOpen(false)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Employee Confirmation Dialog */}
            <Dialog open={isDeleteEmployeeDialogOpen} onOpenChange={setIsDeleteEmployeeDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Employee Deactivation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Deactivate Employee
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Are you sure you want to deactivate{" "}
                                    <span className="font-medium">
                                        {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                                    </span>
                                    ? They will be marked inactive and hidden from the active employee list.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleConfirmDeleteEmployee}
                                variant="destructive"
                                className="flex-1"
                                disabled={removeEmployeeMutation.isPending}
                            >
                                {removeEmployeeMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deactivating...
                                    </>
                                ) : (
                                    'Deactivate Employee'
                                )}
                            </Button>
                            <Button variant="outline" onClick={() => setIsDeleteEmployeeDialogOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Department Confirmation Dialog */}
            <ConfirmationModal
                isOpen={isDeleteDepartmentDialogOpen}
                onClose={() => setIsDeleteDepartmentDialogOpen(false)}
                onConfirm={handleConfirmDeleteDepartment}
                title="Delete Department"
                message={
                    <>
                        Are you sure you want to delete <strong className="space-y-4 text-red-600 dark:text-red-400">{selectedDepartment?.name}</strong>?
                        This action cannot be undone.
                    </>
                }

                confirmText="Delete Department"
                isLoading={deleteDepartmentMutation.isPending}
                type="danger"
            />
        </>
    );
};

export default ManageEmployeesPage;
