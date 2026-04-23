import React, { useState, useEffect, useCallback } from 'react';
import {
    User, Mail, Phone, Lock, Edit2, Save, X, Eye, EyeOff,
    Camera, Loader2, Calendar as CalendarIcon, Users2, Info,
    Clock, Shield, ChevronRight, Briefcase
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { formatDate, timeAgo } from '@/lib/helper';

interface LeaveData {
    leave_type: string;
    leave_count: number;
}

interface UserPayload {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    jobTitle: string;
    dob: string | null;
    gender: string;
    department: string;
    phoneNumber: string;
    createdAt: string;
    updatedAt: string;
    leaveData: LeaveData[];
}

interface UserApiResponse {
    code: string;
    message: string;
    error: boolean;
    payload: UserPayload;
}

interface ProfileFormData {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    jobTitle: string;
    gender: string;
    dob: string;
}

interface PasswordFormData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// ── Reusable field components ────────────────────────────────────────────────

const ReadOnlyField: React.FC<{ label: string; value: string; icon?: React.ReactNode; note?: string }> = ({
    label, value, icon, note,
}) => (
    <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
        <div className="flex items-center gap-2">
            {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value || '—'}</p>
        </div>
        {note && (
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />{note}
            </p>
        )}
    </div>
);

const EditableInput: React.FC<{
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    placeholder?: string;
    readOnly?: boolean;
    note?: string;
}> = ({ label, type = 'text', value, onChange, disabled, placeholder, readOnly, note }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            {label}
            {readOnly && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
                    <Lock className="w-2.5 h-2.5" /> Read-only
                </span>
            )}
        </label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled || readOnly}
            placeholder={placeholder}
            className={cn(
                "w-full px-3 py-2.5 rounded-xl text-sm border transition-all duration-150 outline-none",
                readOnly
                    ? "bg-gray-50 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-gray-500 cursor-default"
                    : "bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            )}
        />
        {note && (
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />{note}
            </p>
        )}
    </div>
);

const PasswordInput: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    disabled?: boolean;
}> = ({ label, value, onChange, show, onToggle, disabled }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</label>
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    </div>
);

// ── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { color: string; label: string }> = {
    admin: { color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800', label: 'Admin' },
    manager: { color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800', label: 'Manager' },
    default: { color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800', label: 'Employee' },
};

const getRoleConfig = (role: string) =>
    ROLE_CONFIG[(role || '').toLowerCase()] ?? ROLE_CONFIG.default;

// ── Leave type colours ───────────────────────────────────────────────────────

const LEAVE_COLORS = [
    'from-blue-500 to-blue-600',
    'from-violet-500 to-violet-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
];

// ── Main component ───────────────────────────────────────────────────────────

const UserProfilePage: React.FC = () => {
    const { authFetch } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPasswordLoading, setIsChangingPasswordLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userData, setUserData] = useState<UserPayload | null>(null);

    const [profileData, setProfileData] = useState<ProfileFormData>({
        firstName: '', lastName: '', email: '', phoneNumber: '', jobTitle: '', gender: '', dob: '',
    });

    const [passwordData, setPasswordData] = useState<PasswordFormData>({
        currentPassword: '', newPassword: '', confirmPassword: '',
    });

    const fetchUserData = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await authFetch('/users/me', { method: 'GET' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result: UserApiResponse = await res.json();
            if (result.error || result.code !== 'SUCCESS') throw new Error(result.message || 'Failed');
            setUserData(result.payload);
            setProfileData({
                firstName: result.payload.firstName,
                lastName: result.payload.lastName,
                email: result.payload.email,
                phoneNumber: result.payload.phoneNumber,
                jobTitle: result.payload.jobTitle,
                gender: result.payload.gender,
                dob: result.payload.dob || '',
            });
        } catch (e) {
            toast.error('Error', { description: e instanceof Error ? e.message : 'Failed to load profile' });
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    useEffect(() => { fetchUserData(); }, [fetchUserData]);

    const setField = (field: keyof ProfileFormData) => (value: string) =>
        setProfileData(prev => ({ ...prev, [field]: value }));

    const setPwField = (field: keyof PasswordFormData) => (value: string) =>
        setPasswordData(prev => ({ ...prev, [field]: value }));

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true);
            const res = await authFetch('/users/me/update', {
                method: 'POST',
                body: JSON.stringify({ ...profileData, id: userData?.id }),
            });
            const result = await res.json();
            if (result.error) throw new Error(result.message || 'Failed to update');
            toast.success('Profile updated successfully.');
            setIsEditing(false);
            await fetchUserData();
        } catch (e) {
            toast.error('Error', { description: e instanceof Error ? e.message : 'Failed' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error('Passwords do not match.');
        }
        if (passwordData.newPassword.length < 8) {
            return toast.error('Password must be at least 8 characters.');
        }
        try {
            setIsChangingPasswordLoading(true);
            const accessToken = localStorage.getItem('accessToken');
            const res = await authFetch('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ accessToken, currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
            });
            const result = await res.json();
            if (result.error) throw new Error(result.message || 'Failed');
            toast.success('Password updated successfully.');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setIsChangingPassword(false);
        } catch (e) {
            toast.error('Error', { description: e instanceof Error ? e.message : 'Failed' });
        } finally {
            setIsChangingPasswordLoading(false);
        }
    };

    const cancelEdit = () => {
        if (userData) {
            setProfileData({
                firstName: userData.firstName, lastName: userData.lastName,
                email: userData.email, phoneNumber: userData.phoneNumber,
                jobTitle: userData.jobTitle, gender: userData.gender, dob: userData.dob || '',
            });
        }
        setIsEditing(false);
    };

    const getInitials = (f: string, l: string) =>
        `${f?.charAt(0) || ''}${l?.charAt(0) || ''}`.toUpperCase();

    // ── Loading / error states ─────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading your profile…</p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Could not load profile data.</p>
                    <Button onClick={fetchUserData} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const roleConfig = getRoleConfig(userData.role);

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="max-w-5xl mx-auto px-4 py-2 space-y-6">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">My Profile</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Manage your personal information and account security
                    </p>
                </div>

                {!isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 h-9 text-sm font-medium shadow-sm"
                    >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={cancelEdit}
                            disabled={isSaving}
                            variant="outline"
                            className="rounded-xl h-9 text-sm border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300"
                        >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-sm shadow-sm"
                        >
                            {isSaving
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</>
                                : <><Save className="w-3.5 h-3.5 mr-1.5" />Save Changes</>
                            }
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT SIDEBAR ── */}
                <div className="space-y-5">

                    {/* Identity card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                        {/* Banner strip */}
                        <div className="h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 relative">
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                        </div>

                        <div className="px-5 pb-5">
                            {/* Avatar */}
                            <div className="relative inline-block -mt-9 mb-3">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold ring-4 ring-white dark:ring-slate-800 shadow-lg">
                                    {getInitials(profileData.firstName, profileData.lastName)}
                                </div>
                                {isEditing && (
                                    <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-md transition-colors">
                                        <Camera className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                {profileData.firstName} {profileData.lastName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                                {profileData.jobTitle || 'No title set'}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg', roleConfig.color)}>
                                    {roleConfig.label}
                                </span>
                                {userData.department && (
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-slate-600">
                                        {userData.department}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Meta strip */}
                        <div className="border-t border-gray-50 dark:border-slate-700/60 divide-y divide-gray-50 dark:divide-slate-700/60">
                            <div className="flex items-center gap-3 px-5 py-3">
                                <CalendarIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Joined</p>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(userData.createdAt)}</p>
                                </div>
                                <span className="ml-auto text-[10px] text-gray-400">{timeAgo(userData.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3 px-5 py-3">
                                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Updated</p>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(userData.updatedAt)}</p>
                                </div>
                                <span className="ml-auto text-[10px] text-gray-400">{timeAgo(userData.updatedAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Leave balance */}
                    {userData.leaveData?.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Leave Balance</h4>
                            </div>
                            <div className="space-y-2.5">
                                {userData.leaveData.map((leave, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={cn(
                                            'w-2 h-2 rounded-full bg-gradient-to-br shrink-0',
                                            LEAVE_COLORS[i % LEAVE_COLORS.length]
                                        )} />
                                        <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">
                                            {leave.leave_type}
                                        </span>
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            {leave.leave_count}
                                            <span className="font-normal text-gray-400 ml-0.5"> Days</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT CONTENT ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Personal information */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Personal Information</h4>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Update your name, contact, and personal details</p>
                            </div>
                        </div>

                        {isEditing ? (
                            /* ─ Edit mode grid ─ */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <EditableInput label="First Name" value={profileData.firstName} onChange={setField('firstName')} disabled={isSaving} />
                                <EditableInput label="Last Name" value={profileData.lastName} onChange={setField('lastName')} disabled={isSaving} />

                                <EditableInput
                                    label="Email Address" type="email"
                                    value={profileData.email} onChange={setField('email')}
                                    readOnly
                                // note="Email cannot be changed for security reasons"
                                />

                                <EditableInput
                                    label="Phone Number" type="tel"
                                    value={profileData.phoneNumber} onChange={setField('phoneNumber')}
                                    disabled={isSaving} placeholder="+27 xx xxx xxxx"
                                />

                                {/* Date of Birth */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                        Date of Birth
                                    </label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                disabled={isSaving}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal h-10 rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm",
                                                    !profileData.dob && "text-gray-400"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-gray-400" />
                                                {profileData.dob
                                                    ? format(new Date(profileData.dob), "PPP")
                                                    : <span>Pick a date</span>
                                                }
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={profileData.dob ? new Date(profileData.dob) : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        const y = date.getFullYear();
                                                        const m = String(date.getMonth() + 1).padStart(2, '0');
                                                        const d = String(date.getDate()).padStart(2, '0');
                                                        setField('dob')(`${y}-${m}-${d}`);
                                                    }
                                                }}
                                                autoFocus
                                                disabled={d => d > new Date()}
                                                captionLayout="dropdown"
                                                startMonth={new Date(1900, 0)}
                                                endMonth={new Date(new Date().getFullYear(), 0)}
                                                className="rounded-xl border border-gray-100 dark:border-slate-700"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Gender */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Gender</label>
                                    <select
                                        value={profileData.gender}
                                        onChange={e => setField('gender')(e.target.value)}
                                        disabled={isSaving}
                                        className="w-full px-3 py-2.5 h-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="-">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            /* ─ View mode grid ─ */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                <ReadOnlyField label="First Name" value={profileData.firstName} />
                                <ReadOnlyField label="Last Name" value={profileData.lastName} />
                                <ReadOnlyField
                                    label="Email Address"
                                    value={profileData.email}
                                    icon={<Mail className="w-3.5 h-3.5" />}
                                // note="Cannot be changed for security reasons"
                                />
                                <ReadOnlyField
                                    label="Phone Number"
                                    value={profileData.phoneNumber || 'Not provided'}
                                    icon={<Phone className="w-3.5 h-3.5" />}
                                />
                                <ReadOnlyField
                                    label="Date of Birth"
                                    value={profileData.dob ? formatDate(profileData.dob) : 'Not provided'}
                                    icon={<CalendarIcon className="w-3.5 h-3.5" />}
                                />
                                <ReadOnlyField
                                    label="Gender"
                                    value={profileData.gender === '-' ? 'Prefer not to say' : profileData.gender || 'Not provided'}
                                    icon={<Users2 className="w-3.5 h-3.5" />}
                                />
                                <ReadOnlyField
                                    label="Job Title"
                                    value={profileData.jobTitle || 'Not set'}
                                    icon={<Briefcase className="w-3.5 h-3.5" />}
                                />
                                <ReadOnlyField
                                    label="Department"
                                    value={userData.department || 'Not assigned'}
                                    icon={<Users2 className="w-3.5 h-3.5" />}
                                />
                            </div>
                        )}
                    </div>

                    {/* Security / password */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Security</h4>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Manage your password and login security</p>
                                </div>
                            </div>
                            {!isChangingPassword && (
                                <button
                                    onClick={() => setIsChangingPassword(true)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                                >
                                    Change password
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {isChangingPassword && (
                            <div className="mt-6">
                                <div className="h-px bg-gray-100 dark:bg-slate-700 -mx-6 mb-6" />

                                {/* Step 1 — verify current password */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Verify your current password</p>
                                    </div>
                                    <PasswordInput
                                        label="Current Password"
                                        value={passwordData.currentPassword}
                                        onChange={setPwField('currentPassword')}
                                        show={showCurrentPassword}
                                        onToggle={() => setShowCurrentPassword(p => !p)}
                                        disabled={isChangingPasswordLoading}
                                    />
                                </div>

                                {/* Step divider */}
                                <div className="flex items-center gap-3 my-5">
                                    <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">then</span>
                                    <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
                                </div>

                                {/* Step 2 — set new password */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Set your new password</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <PasswordInput
                                            label="New Password"
                                            value={passwordData.newPassword}
                                            onChange={setPwField('newPassword')}
                                            show={showNewPassword}
                                            onToggle={() => setShowNewPassword(p => !p)}
                                            disabled={isChangingPasswordLoading}
                                        />
                                        <PasswordInput
                                            label="Confirm New Password"
                                            value={passwordData.confirmPassword}
                                            onChange={setPwField('confirmPassword')}
                                            show={showConfirmPassword}
                                            onToggle={() => setShowConfirmPassword(p => !p)}
                                            disabled={isChangingPasswordLoading}
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2.5 flex items-center gap-1">
                                        <Info className="w-3 h-3 shrink-0" />
                                        Must be at least 8 characters
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-slate-700">
                                    <Button
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        }}
                                        disabled={isChangingPasswordLoading}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 h-9 text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={isChangingPasswordLoading}
                                        size="sm"
                                        className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white h-9 text-xs shadow-sm"
                                    >
                                        {isChangingPasswordLoading
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Updating…</>
                                            : <><Lock className="w-3.5 h-3.5 mr-1.5" />Update Password</>
                                        }
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!isChangingPassword && (
                            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password protected</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Your account is secured with a password</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
