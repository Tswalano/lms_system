/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, FileText, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/contexts/AuthContext";

interface LeaveApplicationData {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    leaveLength: 'half_day' | 'full_day';
}

interface ApiResponse {
    success: boolean;
    message: string;
    data?: any;
}

const ApplyLeave = () => {
    const { authFetch } = useAuth();
    const [formData, setFormData] = useState<LeaveApplicationData>({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        leaveLength: 'full_day'
    });

    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    // Effect to handle leave length changes
    useEffect(() => {
        if (formData.leaveLength === 'half_day' && formData.startDate) {
            setFormData(prev => ({
                ...prev,
                endDate: formData.startDate
            }));
        }
    }, [formData.leaveLength, formData.startDate]);

    // API function to submit leave application
    const submitLeaveApplication = async (data: LeaveApplicationData): Promise<ApiResponse> => {
        // Convert form data to API format
        const payload = {
            leave_type: data.leaveType,
            leave_start: data.startDate,
            leave_end: data.endDate,
            leave_comment: data.reason,
            leave_length: data.leaveLength
        };

        const response = await authFetch('/leave/apply-leave', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to submit leave application');
        }

        return result;
    };

    // React Query mutation for submitting leave application
    const {
        mutate: submitApplication,
        isPending,
        isError,
        error
    } = useMutation({
        mutationFn: submitLeaveApplication,
        onSuccess: (data) => {
            toast.success("Leave Application Submitted", {
                description: data.message || "Your leave request has been submitted for approval.",
            });

            // Clear form on success
            setFormData({
                leaveType: '',
                startDate: '',
                endDate: '',
                reason: '',
                leaveLength: 'full_day'
            });

            // Invalidate and refetch calendar data to show new leave request
            queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });
        },
        onError: (error) => {
            toast.error("Submission Failed", {
                description: error instanceof Error ? error.message : "Failed to submit leave application. Please try again.",
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
            toast.error("Missing Required Fields", {
                description: "Please fill in all required fields.",
            });
            return;
        }

        // Date validation
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            toast.error("Invalid Start Date", {
                description: "Start date cannot be in the past."
            });
            return;
        }

        if (formData.leaveLength === 'full_day' && endDate < startDate) {
            toast.error("Invalid Date Range", {
                description: "End date cannot be before start date."
            });
            return;
        }

        // Submit the application
        submitApplication(formData);
    };

    const clearForm = () => {
        setFormData({
            leaveType: '',
            startDate: '',
            endDate: '',
            reason: '',
            leaveLength: 'full_day'
        });
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Unauthorized</h2>
                    <p className="text-gray-600 dark:text-gray-400">Please log in to apply for leave.</p>
                </div>
            </div>
        );
    }

    const formatDateToLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    // Get minimum date (today)
    const startDate = formData.startDate ? new Date(formData.startDate) : undefined;
    const endDate = formData.endDate ? new Date(formData.endDate) : undefined;

    return (

        <div className="px-16 max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Apply for Leave</h1>
                        <p className="text-gray-600 dark:text-gray-400">Submit your leave application</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="leaveType" className="text-gray-700 dark:text-gray-300">Leave Type *</Label>
                        <Select
                            value={formData.leaveType}
                            onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
                            disabled={isPending}
                        >
                            <SelectTrigger className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                <SelectItem
                                    value="Annual Leave"
                                    className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                >
                                    Annual Leave
                                </SelectItem>
                                <SelectItem
                                    value="Sick Leave"
                                    className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                >
                                    Sick Leave
                                </SelectItem>
                                <SelectItem
                                    value="Paternity Leave"
                                    className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                >
                                    Paternity Leave
                                </SelectItem>
                                <SelectItem
                                    value="Family Responsibility"
                                    className="hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                                >
                                    Family Responsibility
                                </SelectItem>
                            </SelectContent>
                        </Select>

                    </div>

                    <div className="space-y-4">
                        <Label className="text-gray-700 dark:text-gray-300">Leave Length *</Label>
                        <RadioGroup
                            value={formData.leaveLength}
                            onValueChange={(value: 'half_day' | 'full_day') => setFormData({ ...formData, leaveLength: value })}
                            className="flex gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="full_day" id="full_day" />
                                <Label htmlFor="full_day">Full Day</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="half_day" id="half_day" />
                                <Label htmlFor="half_day">Half Day</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                        <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span>Start Date *</span>
                                </div>
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600",
                                            !startDate && "text-muted-foreground"
                                        )}
                                        disabled={isPending}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-300" />
                                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                const dateString = formatDateToLocal(date);
                                                setFormData({ ...formData, startDate: dateString });
                                                if (formData.leaveLength === "half_day") {
                                                    setFormData((prev) => ({ ...prev, endDate: dateString }));
                                                }
                                            }
                                        }}
                                        initialFocus
                                        disabled={(date) => {
                                            const today = new Date();
                                            const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                            const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                            return compareDate < compareToday;
                                        }}
                                        className="bg-white dark:bg-slate-800"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                        <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span>End Date *</span>
                                </div>
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600",
                                            !endDate && "text-muted-foreground"
                                        )}
                                        disabled={isPending || formData.leaveLength === "half_day"}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-300" />
                                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                const dateString = formatDateToLocal(date);
                                                setFormData({ ...formData, endDate: dateString });
                                            }
                                        }}
                                        initialFocus
                                        disabled={(date) => {
                                            const today = new Date();
                                            const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                            const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                            return compareDate < compareToday;
                                        }}
                                        className="bg-white dark:bg-slate-800"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>


                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-gray-700 dark:text-gray-300">Reason for Leave *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Please provide a detailed reason for your leave request..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 min-h-[120px]"
                            disabled={isPending}
                        />
                    </div>

                    {/* Error Display */}
                    {isError && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 text-sm">
                                {error instanceof Error ? error.message : 'An error occurred while submitting your application.'}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-8"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Application
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            onClick={clearForm}
                            variant="outline"
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                            disabled={isPending}
                        >
                            Clear Form
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplyLeave;