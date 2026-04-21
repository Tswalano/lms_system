/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { CalendarRange, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/contexts/AuthContext";
import moment from "moment";

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

const ApplyLeavePage = () => {
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

    const formatDateToLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = formatDateToLocal(new Date());

    useEffect(() => {
        if (formData.leaveLength === 'half_day' && formData.startDate) {
            setFormData(prev => ({ ...prev, endDate: formData.startDate }));
        }
    }, [formData.leaveLength, formData.startDate]);

    const selectedDayCount = (() => {
        if (!formData.startDate || !formData.endDate) return 0;
        return moment(formData.endDate).startOf('day').diff(moment(formData.startDate).startOf('day'), 'days') + 1;
    })();

    const submitLeaveApplication = async (data: LeaveApplicationData): Promise<ApiResponse> => {
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
        if (!result.success) throw new Error(result.message || 'Failed to submit leave application');
        return result;
    };

    const { mutate: submitApplication, isPending, isError, error } = useMutation({
        mutationFn: submitLeaveApplication,
        onSuccess: (data) => {
            toast.success("Leave Application Submitted", {
                description: data.message || "Your leave request has been submitted for approval.",
            });
            setFormData({ leaveType: '', startDate: '', endDate: '', reason: '', leaveLength: 'full_day' });
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

        if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
            toast.error("Missing Required Fields", { description: "Please fill in all required fields." });
            return;
        }

        const startDate = moment(formData.startDate).startOf('day');
        const endDate = moment(formData.endDate).startOf('day');
        const todayM = moment().startOf('day');

        if (formData.leaveLength === 'full_day' && endDate.isBefore(startDate, 'day')) {
            toast.error("Invalid Date Range", { description: "End date cannot be before start date." });
            return;
        }

        submitApplication(formData);
    };

    const clearForm = () => {
        setFormData({ leaveType: '', startDate: '', endDate: '', reason: '', leaveLength: 'full_day' });
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Unauthorized</h2>
                    <p className="text-gray-600 dark:text-gray-400">Please log in to apply for leave.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                        <CalendarRange className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Apply for Leave</h1>
                        <p className="text-gray-600 dark:text-gray-400">Submit your leave application</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-200/50 dark:border-slate-600/50 overflow-hidden">
                {/* Form header band */}
                <div className="p-6 border-b border-gray-200/50 dark:border-slate-600/50 bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {formData.startDate && formData.endDate
                                    ? `${moment(formData.startDate).format('MMM D, YYYY')} — ${moment(formData.endDate).format('MMM D, YYYY')}`
                                    : 'Select your leave dates below'}
                            </p>
                        </div>
                        {selectedDayCount > 0 && (
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-800/80 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-slate-600">
                                <span className="font-bold">{selectedDayCount}</span>
                                <span>{selectedDayCount === 1 ? 'day selected' : 'days selected'}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Leave Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-gray-700 dark:text-gray-300">Leave Type *</Label>
                                <Select
                                    value={formData.leaveType}
                                    onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        <SelectValue placeholder="Select leave type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                                        <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                                        <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                                        <SelectItem value="Family Responsibility">Family Responsibility</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Leave Length */}
                            <div className="space-y-3 md:col-span-2">
                                <Label className="text-gray-700 dark:text-gray-300">Leave Length *</Label>
                                <RadioGroup
                                    value={formData.leaveLength}
                                    onValueChange={(value: 'half_day' | 'full_day') => setFormData({ ...formData, leaveLength: value })}
                                    className="flex flex-col sm:flex-row gap-4"
                                    disabled={isPending}
                                >
                                    <Label htmlFor="apply_full_day" className={cn(
                                        "flex items-center space-x-2 rounded-xl border px-4 py-3 flex-1 cursor-pointer transition-colors",
                                        formData.leaveLength === 'full_day'
                                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                                            : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
                                    )}>
                                        <RadioGroupItem value="full_day" id="apply_full_day" />
                                        <span>Full Day</span>
                                    </Label>
                                    <Label htmlFor="apply_half_day" className={cn(
                                        "flex items-center space-x-2 rounded-xl border px-4 py-3 flex-1 cursor-pointer transition-colors",
                                        formData.leaveLength === 'half_day'
                                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                                            : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
                                    )}>
                                        <RadioGroupItem value="half_day" id="apply_half_day" />
                                        <span>Half Day</span>
                                    </Label>
                                </RadioGroup>
                            </div>

                            {/* Start Date */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Start Date *</Label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        startDate: e.target.value,
                                        endDate: prev.leaveLength === 'half_day'
                                            ? e.target.value
                                            : (prev.endDate && prev.endDate < e.target.value ? e.target.value : prev.endDate)
                                    }))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    disabled={isPending}
                                />
                            </div>

                            {/* End Date */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">End Date *</Label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    min={formData.startDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                                    disabled={isPending || formData.leaveLength === 'half_day'}
                                />
                            </div>
                        </div>

                        {/* Past-date warning */}
                        {formData.startDate && moment(formData.startDate).isBefore(moment(), 'day') && (
                            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Backdated Leave Application</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">You are applying for leave starting in the past. Make sure this is intentional.</p>
                                </div>
                            </div>
                        )}

                        {/* Reason */}
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

                        {isError && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                <p className="text-red-600 dark:text-red-400 text-sm">
                                    {error instanceof Error ? error.message : 'An error occurred while submitting your application.'}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</>
                                ) : 'Submit Application'}
                            </Button>
                            <Button
                                type="button"
                                onClick={clearForm}
                                variant="outline"
                                className="bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600"
                                disabled={isPending}
                            >
                                Clear Form
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeavePage;
