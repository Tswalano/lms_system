import { useEffect, useRef, useState } from "react";
import { Users, Building2, UserPlus, Plus, Edit, Search, Loader2, AlertCircle, Shield, User, Trash2, X, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { cn } from "@/lib/utils";

const LIST_BATCH_SIZE = 8;

// Employee Interfaces
interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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

const roleBadgeClasses = (role: string) => {
    if (role === 'admin') {
        return "bg-green-100 text-green-600 dark:bg-green-700 dark:text-green-200";
    }
    if (role === 'manager') {
        return "bg-blue-100 text-blue-600 dark:bg-blue-700 dark:text-blue-200";
    }
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200";
};

const roleLabel = (role: string) => {
    if (role === 'admin') return 'Admin';
    if (role === 'manager') return 'Manager';
    return 'Employee';
};

const ManageEmployeesPage = () => {
    const { authFetch } = useAuth();
    const [activeTab, setActiveTab] = useState("employees");
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
    const [visibleEmployeeCount, setVisibleEmployeeCount] = useState(LIST_BATCH_SIZE);
    const [visibleDepartmentCount, setVisibleDepartmentCount] = useState(LIST_BATCH_SIZE);
    const employeeLoadMoreRef = useRef<HTMLDivElement | null>(null);
    const departmentLoadMoreRef = useRef<HTMLDivElement | null>(null);

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

        try {
            const response = await authFetch('/users', { method: 'GET' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result: EmployeeApiResponse<Employee[]> = await response.json();
            if (result.error) throw new Error(result.message || 'Failed to fetch employees');

            const employeeList = Array.isArray(result.payload?.users) ? result.payload.users : [];
            const departmentList = Array.isArray(result.payload?.departments) ? result.payload.departments : [];

            setDepartments(departmentList);

            return employeeList;
        } catch (error) {
            console.error('ManageEmployeesPage: failed to fetch employees', error);
            throw error instanceof Error ? error : new Error('Failed to fetch employees');
        }
    };

    // Fetch departments
    const fetchDepartments = async (): Promise<Department[]> => {
        if (!token) throw new Error('Unauthorized');

        try {
            const response = await authFetch('/admin-docs/departments', {
                method: 'GET',
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result: DepartmentApiResponse<Department[]> = await response.json();
            if (result.error) throw new Error(result.message || 'Failed to fetch departments');

            return Array.isArray(result.payload) ? result.payload : [];
        } catch (error) {
            console.error('ManageEmployeesPage: failed to fetch departments', error);
            throw error instanceof Error ? error : new Error('Failed to fetch departments');
        }
    };

    // React Query hooks
    const {
        data: employeesData = [],
        isLoading: employeesLoading,
        error: employeesError,
        refetch: refetchEmployees,
    } = useQuery({
        queryKey: ['employees'],
        queryFn: fetchEmployees,
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    const {
        data: departmentsData = [],
        isLoading: departmentsLoading,
        error: departmentsError,
        refetch: refetchDepartments,
    } = useQuery({
        queryKey: ['departments'],
        queryFn: fetchDepartments,
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    const employees = Array.isArray(employeesData) ? employeesData : [];

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

    const getDepartmentEmployeeCount = (departmentId: number) =>
        employees.filter(emp => emp.departmentId === departmentId).length;

    const getInitials = (firstName: string, lastName: string) =>
        `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

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
                body: JSON.stringify({ id: employeeId, email: selectedEmployee?.email })
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
            toast.success("Employee Removed", {
                description: `Employee has been removed from the system.`
            });
        },
        onError: (error) => {
            toast.error("Error Removing Employee", {
                description: error instanceof Error ? error.message : "Failed to remove employee. Please try again.",
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

    // Filter functions
    const filteredEmployees = employees.filter(employee => {
        const fullName = `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        const departmentName = getDepartmentName(employee.departmentId || employee.departmentId, employee.department).toLowerCase();

        return fullName.includes(searchLower) ||
            (employee.email ?? '').toLowerCase().includes(searchLower) ||
            (employee.jobTitle ?? '').toLowerCase().includes(searchLower) ||
            departmentName.includes(searchLower);
    });

    const filteredDepartments = departmentsData.filter(department => {
        const searchLower = departmentSearchTerm.toLowerCase();
        return (department.name ?? '').toLowerCase().includes(searchLower) ||
            (department.description ?? '').toLowerCase().includes(searchLower);
    });

    const visibleEmployees = filteredEmployees.slice(0, visibleEmployeeCount);
    const visibleDepartments = filteredDepartments.slice(0, visibleDepartmentCount);

    useEffect(() => {
        setVisibleEmployeeCount(LIST_BATCH_SIZE);
    }, [searchTerm, filteredEmployees.length]);

    useEffect(() => {
        setVisibleDepartmentCount(LIST_BATCH_SIZE);
    }, [departmentSearchTerm, filteredDepartments.length]);

    useEffect(() => {
        if (activeTab !== "employees") return;
        if (visibleEmployeeCount >= filteredEmployees.length) return;

        const node = employeeLoadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisibleEmployeeCount((count) => Math.min(count + LIST_BATCH_SIZE, filteredEmployees.length));
                }
            },
            { rootMargin: "180px 0px" }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [activeTab, visibleEmployeeCount, filteredEmployees.length]);

    useEffect(() => {
        if (activeTab !== "departments") return;
        if (visibleDepartmentCount >= filteredDepartments.length) return;

        const node = departmentLoadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisibleDepartmentCount((count) => Math.min(count + LIST_BATCH_SIZE, filteredDepartments.length));
                }
            },
            { rootMargin: "180px 0px" }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [activeTab, visibleDepartmentCount, filteredDepartments.length]);

    useEffect(() => {
        const isAnySheetOpen =
            isAddEmployeeDialogOpen ||
            isEditEmployeeDialogOpen ||
            isDeleteEmployeeDialogOpen ||
            isAddDepartmentDialogOpen ||
            isEditDepartmentDialogOpen ||
            isDeleteDepartmentDialogOpen;

        if (!isAnySheetOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;

            if (isDeleteDepartmentDialogOpen) {
                setIsDeleteDepartmentDialogOpen(false);
                return;
            }
            if (isDeleteEmployeeDialogOpen) {
                setIsDeleteEmployeeDialogOpen(false);
                return;
            }
            if (isEditDepartmentDialogOpen) {
                setIsEditDepartmentDialogOpen(false);
                return;
            }
            if (isAddDepartmentDialogOpen) {
                setIsAddDepartmentDialogOpen(false);
                return;
            }
            if (isEditEmployeeDialogOpen) {
                setIsEditEmployeeDialogOpen(false);
                return;
            }
            if (isAddEmployeeDialogOpen) {
                setIsAddEmployeeDialogOpen(false);
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [
        isAddDepartmentDialogOpen,
        isAddEmployeeDialogOpen,
        isDeleteDepartmentDialogOpen,
        isDeleteEmployeeDialogOpen,
        isEditDepartmentDialogOpen,
        isEditEmployeeDialogOpen,
    ]);

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
            <div className="flex h-[calc(100dvh-8.25rem)] min-h-0 flex-col md:h-[calc(100dvh-5rem)]">
            <div className="sticky top-0 z-20 shrink-0 space-y-3 bg-background/95 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <MobilePageHeader />
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-start gap-2.5">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500">
                                <Users className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 sm:text-2xl">Manage Team</h1>
                                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">Manage employees and departments in one place</p>
                            </div>
                        </div>
                    </div>
                    {activeTab === "employees" ? (
                        <button
                            onClick={() => setIsAddEmployeeDialogOpen(true)}
                            className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add Employee
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsAddDepartmentDialogOpen(true)}
                            className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add Department
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 min-h-0 flex-col">
                <div className="sticky top-0 z-20 shrink-0 space-y-3 bg-background/95 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 dark:bg-slate-800">
                    <TabsTrigger
                        value="employees"
                        className="flex h-10 items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                    >
                        <Users className="w-4 h-4" />
                        Employees
                    </TabsTrigger>
                    <TabsTrigger
                        value="departments"
                        className="flex h-10 items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                    >
                        <Building2 className="w-4 h-4" />
                        Departments
                    </TabsTrigger>
                </TabsList>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder={activeTab === "employees"
                            ? "Search employees by name, email, occupation, or department..."
                            : "Search departments by name or description..."}
                        value={activeTab === "employees" ? searchTerm : departmentSearchTerm}
                        onChange={(e) => {
                            if (activeTab === "employees") {
                                setSearchTerm(e.target.value);
                            } else {
                                setDepartmentSearchTerm(e.target.value);
                            }
                        }}
                        className="pl-10 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    />
                </div>
                </div>

                {/* Employees Tab */}
                <TabsContent value="employees" className="mt-0 flex-1 min-h-0 overflow-hidden data-[state=inactive]:hidden">
                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        {employeesLoading ? (
                            <div className="flex flex-1 items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
                                </div>
                            </div>
                        ) : employeesError ? (
                            <div className="flex flex-1 items-center justify-center">
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
                            <div className="flex flex-1 items-center justify-center">
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
                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                            <div className="space-y-2.5 p-3 pb-24 md:hidden">
                                {visibleEmployees.map((employee) => (
                                    <article
                                        key={employee.id}
                                        className="w-full rounded-2xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-semibold text-white">
                                                {getInitials(employee.firstName, employee.lastName)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                            {employee.firstName} {employee.lastName}
                                                        </h3>
                                                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{employee.email}</p>
                                                    </div>
                                                    <Badge className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium", roleBadgeClasses(employee.role))}>
                                                        {roleLabel(employee.role)}
                                                    </Badge>
                                                </div>

                                                <p className="mt-2 truncate text-sm text-gray-700 dark:text-gray-300">
                                                    {employee.jobTitle}
                                                    <span className="mx-1.5 text-gray-300 dark:text-slate-500">•</span>
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {getDepartmentName(employee.departmentId || employee.departmentId, employee.department)}
                                                    </span>
                                                </p>

                                                <div className="mt-3 flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 rounded-full border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                        onClick={() => handleOpenEditEmployeeDialog(employee)}
                                                    >
                                                        <Edit className="mr-1 h-3.5 w-3.5" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 rounded-full border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                                        onClick={() => handleOpenDeleteEmployeeDialog(employee)}
                                                    >
                                                        <UserMinus className="mr-1 h-3.5 w-3.5" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="hidden p-3 pb-6 md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-100 dark:border-slate-700">
                                        <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Occupation</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Department</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Role</TableHead>
                                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleEmployees.map((employee) => (
                                        <TableRow key={employee.id} className="border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-semibold text-white">
                                                        {getInitials(employee.firstName, employee.lastName)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">
                                                            {employee.firstName} {employee.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">{employee.jobTitle}</TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">
                                                {getDepartmentName(employee.departmentId || employee.departmentId, employee.department)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn("flex items-center gap-1 w-fit", roleBadgeClasses(employee.role))}>
                                                    {employee.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                    {roleLabel(employee.role)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 rounded-full border-blue-200 bg-blue-50 px-3 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                                                        onClick={() => handleOpenEditEmployeeDialog(employee)}
                                                    >
                                                        <Edit className="w-3.5 h-3.5 mr-1" />
                                                        <span className="text-xs font-medium">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 rounded-full border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                                        onClick={() => handleOpenDeleteEmployeeDialog(employee)}
                                                    >
                                                        <UserMinus className="w-3.5 h-3.5 mr-1" />
                                                        <span className="text-xs font-medium">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                            </div>
                            {filteredEmployees.length > 0 && (
                                <div className="shrink-0 border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-500 dark:border-slate-700 dark:text-gray-400">
                                    Showing {visibleEmployees.length} of {filteredEmployees.length} employees
                                    {visibleEmployees.length < filteredEmployees.length && (
                                        <div ref={employeeLoadMoreRef} className="h-3 w-full" />
                                    )}
                                </div>
                            )}
                            </>
                        )}
                    </div>
                </TabsContent>

                {/* Departments Tab */}
                <TabsContent value="departments" className="mt-0 flex-1 min-h-0 overflow-hidden data-[state=inactive]:hidden">
                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        {departmentsLoading ? (
                            <div className="flex flex-1 items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">Loading departments...</p>
                                </div>
                            </div>
                        ) : departmentsError ? (
                            <div className="flex flex-1 items-center justify-center">
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
                            <div className="flex flex-1 items-center justify-center">
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
                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                            <div className="space-y-2.5 p-3 pb-24 md:hidden">
                                {visibleDepartments.map((department) => {
                                    const employeeCount = getDepartmentEmployeeCount(department.id);

                                    return (
                                        <article
                                            key={department.id}
                                            className="w-full rounded-2xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                        {department.name}
                                                    </h3>
                                                    <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
                                                        {department.description || 'No description'}
                                                    </p>
                                                </div>
                                                <Badge className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-100 text-blue-600 dark:bg-blue-700 dark:text-blue-200">
                                                    {employeeCount} member{employeeCount === 1 ? '' : 's'}
                                                </Badge>
                                            </div>

                                            <div className="mt-2.5 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                <p>
                                                    <span className="font-medium text-gray-600 dark:text-gray-300">Created</span>
                                                    <span className="mx-1.5 text-gray-300 dark:text-slate-500">•</span>
                                                    {department.createdAt ? formatDate(department.createdAt) : 'N/A'}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-gray-600 dark:text-gray-300">Updated</span>
                                                    <span className="mx-1.5 text-gray-300 dark:text-slate-500">•</span>
                                                    {department.updatedAt ? formatDate(department.updatedAt) : 'N/A'}
                                                </p>
                                            </div>

                                            <div className="mt-3 flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 rounded-full border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                    onClick={() => handleOpenEditDepartmentDialog(department)}
                                                >
                                                    <Edit className="mr-1 h-3.5 w-3.5" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 rounded-full border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 disabled:opacity-60"
                                                    onClick={() => handleOpenDeleteDepartmentDialog(department)}
                                                    disabled={employeeCount > 0}
                                                >
                                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <div className="hidden p-3 pb-6 md:block">
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
                                    {visibleDepartments.map((department) => (
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
                                                    {getDepartmentEmployeeCount(department.id)}
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
                                                        disabled={getDepartmentEmployeeCount(department.id) > 0}
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
                            </div>
                            </div>
                            {filteredDepartments.length > 0 && (
                                <div className="shrink-0 border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-500 dark:border-slate-700 dark:text-gray-400">
                                    Showing {visibleDepartments.length} of {filteredDepartments.length} departments
                                    {visibleDepartments.length < filteredDepartments.length && (
                                        <div ref={departmentLoadMoreRef} className="h-3 w-full" />
                                    )}
                                </div>
                            )}
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
            </div>

            {/* Add Employee Dialog */}
            {isAddEmployeeDialogOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-4">
                    <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-gray-200/50 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-slate-800 md:max-w-md md:rounded-3xl">
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600 md:hidden" />
                        <div className="shrink-0 border-b border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 p-5 dark:border-slate-600/50 dark:from-slate-700 dark:to-slate-600">
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

                        <div className="flex-1 overflow-y-auto p-5 pb-28 space-y-4">
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

                        <div className="shrink-0 border-t border-gray-100 bg-gray-50/95 p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl dark:border-slate-600/30 dark:bg-slate-700/30">
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
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-4"
                    onClick={() => setIsEditEmployeeDialogOpen(false)}
                >
                    <div
                        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-gray-200/50 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-slate-800 md:max-w-md md:rounded-3xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600 md:hidden" />
                        <div className="shrink-0 border-b border-slate-700/70 bg-gradient-to-br from-slate-800 to-slate-900 p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">
                                        Edit Employee
                                        <span className="block text-sm font-normal text-slate-300">
                                            ID: {shortenUUID(selectedEmployee?.id || '')}
                                        </span>
                                    </h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditEmployeeDialogOpen(false)}
                                    className="p-2 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 pb-28 space-y-4">
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

                        <div className="shrink-0 border-t border-gray-100 bg-gray-50/95 p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl dark:border-slate-600/30 dark:bg-slate-700/30">
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
                <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-4">
                    <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-gray-200/50 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-slate-800 md:max-w-md md:rounded-3xl">
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600 md:hidden" />
                        <div className="shrink-0 border-b border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 p-5 dark:border-slate-600/50 dark:from-slate-700 dark:to-slate-600">
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

                        <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">
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

                        <div className="shrink-0 border-t border-gray-100 bg-gray-50/95 p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl dark:border-slate-600/30 dark:bg-slate-700/30">
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
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-4"
                    onClick={() => setIsEditDepartmentDialogOpen(false)}
                >
                    <div
                        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-gray-200/50 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-slate-800 md:max-w-md md:rounded-3xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600 md:hidden" />
                        <div className="shrink-0 border-b border-slate-700/70 bg-gradient-to-br from-slate-800 to-slate-900 p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <Edit className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">
                                        Edit Department
                                        <span className="block text-sm font-normal text-slate-300">
                                            ID: {selectedDepartment?.id}
                                        </span>
                                    </h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditDepartmentDialogOpen(false)}
                                    className="p-2 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">
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

                        <div className="shrink-0 border-t border-gray-100 bg-gray-50/95 p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl dark:border-slate-600/30 dark:bg-slate-700/30">
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
            {isDeleteEmployeeDialogOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-4"
                    onClick={() => setIsDeleteEmployeeDialogOpen(false)}
                >
                    <div
                        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-gray-200/50 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-slate-800 md:max-w-md md:rounded-3xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600 md:hidden" />
                        <div className="shrink-0 border-b border-gray-200/50 bg-gradient-to-br from-red-50 to-red-100 p-5 dark:border-slate-600/50 dark:from-slate-800 dark:to-slate-900">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Delete Employee</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone.</p>
                                    </div>
                                </div>
                                <Button variant="ghost" onClick={() => setIsDeleteEmployeeDialogOpen(false)} className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200">
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 pb-24">
                            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
                                <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Removing this employee will permanently delete their record from the team list.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 border-t border-gray-100 bg-gray-50/95 p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl dark:border-slate-600/30 dark:bg-slate-700/30">
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleConfirmDeleteEmployee}
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
                                <Button variant="outline" onClick={() => setIsDeleteEmployeeDialogOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Department Confirmation Dialog */}
            {isDeleteDepartmentDialogOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-4"
                    onClick={() => setIsDeleteDepartmentDialogOpen(false)}
                >
                    <div
                        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-gray-200/50 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-slate-800 md:max-w-md md:rounded-3xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600 md:hidden" />
                        <div className="shrink-0 border-b border-gray-200/50 bg-gradient-to-br from-red-50 to-red-100 p-5 dark:border-slate-600/50 dark:from-slate-800 dark:to-slate-900">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                                        <AlertCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Delete Department</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone.</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsDeleteDepartmentDialogOpen(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 pb-24">
                            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
                                <AlertCircle className="h-8 w-8 flex-shrink-0 text-red-500" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedDepartment?.name}</p>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        Deleting this department will permanently remove it from the system.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 border-t border-gray-100 bg-gray-50/95 p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl dark:border-slate-600/30 dark:bg-slate-700/30">
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleConfirmDeleteDepartment}
                                    variant="destructive"
                                    className="flex-1"
                                    disabled={deleteDepartmentMutation.isPending}
                                >
                                    {deleteDepartmentMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Department'
                                    )}
                                </Button>
                                <Button variant="outline" onClick={() => setIsDeleteDepartmentDialogOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ManageEmployeesPage;
