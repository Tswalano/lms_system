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
import MobilePageHeader from "@/components/layout/MobilePageHeader";
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
        // const todayM = moment().startOf('day');

        if (startDate.isBefore(today, 'day')) {
            toast.warning("Backdated Leave Application", { description: "You are applying for leave that starts in the past." });
        }

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
                    <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-gray-200">Unauthorized</h2>
                    <p className="text-slate-600 dark:text-gray-400">Please log in to apply for leave.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-md px-4 pb-32">
            <MobilePageHeader className="mb-4" />
            <div className="mb-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
                        <CalendarRange className="h-4 w-4" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-950 dark:text-slate-100 md:text-2xl">Apply for Leave</h1>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Submit your leave application</p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/88 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95 dark:shadow-[0_18px_48px_rgba(2,6,23,0.28)]">
                <div className="border-b border-slate-200/80 bg-gradient-to-br from-cyan-500/10 via-white/75 to-emerald-500/10 p-4 dark:border-slate-700 dark:from-cyan-950/40 dark:via-slate-800/90 dark:to-emerald-950/30">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                {formData.startDate && formData.endDate
                                    ? `${moment(formData.startDate).format('MMM D, YYYY')} — ${moment(formData.endDate).format('MMM D, YYYY')}`
                                    : 'Select your leave dates below'}
                            </p>
                        </div>
                        {selectedDayCount > 0 && (
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                                <span className="font-bold">{selectedDayCount}</span>
                                <span>{selectedDayCount === 1 ? 'day selected' : 'days selected'}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 sm:p-5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Leave Type *</Label>
                                <Select
                                    value={formData.leaveType}
                                    onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100">
                                        <SelectValue placeholder="Select leave type" />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                                        <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                                        <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                                        <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                                        <SelectItem value="Family Responsibility">Family Responsibility</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Leave Length *</Label>
                                <RadioGroup
                                    value={formData.leaveLength}
                                    onValueChange={(value: 'half_day' | 'full_day') => setFormData({ ...formData, leaveLength: value })}
                                    className="grid grid-cols-2 gap-3"
                                    disabled={isPending}
                                >
                                    <Label htmlFor="apply_full_day" className={cn(
                                        "flex min-h-12 items-center space-x-2 rounded-2xl border px-4 py-3 cursor-pointer transition-colors",
                                        formData.leaveLength === 'full_day'
                                            ? 'border-cyan-400/50 bg-cyan-500/12 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200'
                                            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300'
                                    )}>
                                        <RadioGroupItem value="full_day" id="apply_full_day" />
                                        <span className="text-sm">Full Day</span>
                                    </Label>
                                    <Label htmlFor="apply_half_day" className={cn(
                                        "flex min-h-12 items-center space-x-2 rounded-2xl border px-4 py-3 cursor-pointer transition-colors",
                                        formData.leaveLength === 'half_day'
                                            ? 'border-cyan-400/50 bg-cyan-500/12 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200'
                                            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300'
                                    )}>
                                        <RadioGroupItem value="half_day" id="apply_half_day" />
                                        <span className="text-sm">Half Day</span>
                                    </Label>
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Start Date *</Label>
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
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                                        disabled={isPending}
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Start date for the leave request.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">End Date *</Label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        min={formData.startDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                                        disabled={isPending || formData.leaveLength === 'half_day'}
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {formData.leaveLength === 'half_day' ? 'Half day leave uses the same start and end date.' : 'End date cannot be before the start date.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {formData.startDate && moment(formData.startDate).isBefore(moment(), 'day') && (
                            <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3">
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                                <div>
                                    <p className="text-sm font-medium text-amber-100">Backdated Leave Application</p>
                                    <p className="mt-0.5 text-xs text-amber-200/80">You are applying for leave starting in the past.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-sm font-medium text-slate-700 dark:text-slate-200">Reason for Leave *</Label>
                            <Textarea
                                id="reason"
                                placeholder="Please provide a brief reason for your leave request..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="min-h-[104px] rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                                rows={4}
                                disabled={isPending}
                            />
                        </div>

                        {isError && (
                            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3">
                                <p className="text-sm text-rose-200">
                                    {error instanceof Error ? error.message : 'An error occurred while submitting your application.'}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3 pt-2 pb-2">
                            <Button
                                type="submit"
                                className="h-12 w-full rounded-2xl bg-cyan-500 text-slate-950 shadow-sm hover:bg-cyan-400"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                                ) : 'Submit Application'}
                            </Button>
                            <Button
                                type="button"
                                onClick={clearForm}
                                variant="outline"
                                className="h-11 w-full rounded-2xl border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
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
