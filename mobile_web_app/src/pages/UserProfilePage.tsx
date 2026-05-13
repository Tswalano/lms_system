import React, { useState, useEffect, useCallback } from 'react';
import {
    User, Mail, Phone, Lock, Edit2, Save, X, Eye, EyeOff,
    Loader2, Calendar as CalendarIcon, Users2, Info,
    Clock, Shield, ChevronRight, Briefcase
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import MobilePageHeader from '@/components/layout/MobilePageHeader';
import { toast } from 'sonner';
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { formatDate, getBirthdayDisplayDate } from '@/lib/helper';

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
    leaveData: {
        leave_type: string;
        leave_count: number;
    }[];
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
    <div className="space-y-1">
        <div className="flex flex-col gap-1 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-4">
            <div className="flex min-w-0 items-center gap-2">
                {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 min-[380px]:text-right">
                {value || '—'}
            </p>
        </div>
        {note && (
            <p className="flex items-center gap-1 pl-0 text-[11px] text-gray-400 dark:text-gray-500 min-[380px]:pl-6">
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
    autoComplete?: string;
}> = ({ label, type = 'text', value, onChange, disabled, placeholder, readOnly, note, autoComplete = 'off' }) => (
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
            autoComplete={autoComplete}
            className={cn(
                "w-full px-3 py-2.5 rounded-xl text-sm border transition-all duration-150 outline-none",
                readOnly
                    ? "bg-gray-50 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-gray-500 cursor-default"
                    : "bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
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
    autoComplete?: string;
}> = ({ label, value, onChange, show, onToggle, disabled, autoComplete = 'off' }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</label>
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                autoComplete={autoComplete}
                className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
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

const ProfileSection: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => (
    <section className="space-y-3">
        <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h5>
        <div className="space-y-3">
            {children}
        </div>
    </section>
);

// ── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { color: string; label: string }> = {
    admin: { color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800', label: 'Admin' },
    manager: { color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800', label: 'Manager' },
    default: { color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800', label: 'Employee' },
};

const getRoleConfig = (role: string) =>
    ROLE_CONFIG[(role || '').toLowerCase()] ?? ROLE_CONFIG.default;

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

    const closePasswordSheet = () => {
        if (isChangingPasswordLoading) return;
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
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

    const closeEditSheet = () => {
        if (isSaving) return;
        cancelEdit();
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
    const fullName = `${profileData.firstName} ${profileData.lastName}`.trim() || 'Not provided';
    const displayGender = profileData.gender === '-' ? 'Prefer not to say' : profileData.gender || 'Not provided';
    const birthdayDisplay = profileData.dob ? getBirthdayDisplayDate(profileData.dob) : null;

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-2">
            <MobilePageHeader />

            <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="relative h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                        />
                    </div>

                    <div className="px-4 pb-3 pt-2.5 sm:px-5">
                        <div className="flex items-start gap-3">
                            <div className="relative shrink-0 -mt-7">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-base font-bold text-white ring-4 ring-white shadow-lg dark:ring-slate-800">
                                    {getInitials(profileData.firstName, profileData.lastName)}
                                </div>
                            </div>

                            <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h1 className="truncate text-base font-bold leading-tight text-gray-900 dark:text-gray-100">
                                            {profileData.firstName} {profileData.lastName}
                                        </h1>
                                        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                                            {profileData.jobTitle || 'No title set'}
                                        </p>
                                    </div>

                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="outline"
                                        className="h-8 shrink-0 rounded-lg border-cyan-200/70 bg-white/85 px-3 text-xs font-medium text-cyan-700 hover:bg-cyan-50 dark:border-cyan-500/30 dark:bg-slate-800/85 dark:text-cyan-300 dark:hover:bg-slate-700"
                                    >
                                        <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                                        Edit
                                    </Button>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    <span className={cn('rounded-lg px-2.5 py-1 text-xs font-semibold', roleConfig.color)}>
                                        {roleConfig.label}
                                    </span>
                                    {userData.department && (
                                        <span className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-slate-700 dark:bg-slate-700 dark:text-gray-400">
                                            {userData.department}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 dark:border-slate-700/70">
                            <div className="flex min-w-0 items-center gap-2">
                                <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Joined</p>
                                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{formatDate(userData.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Updated</p>
                                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{formatDate(userData.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:px-5">
                    <div className="space-y-4">
                        <ProfileSection title="Account">
                            <ReadOnlyField label="Full Name" value={fullName} icon={<User className="h-3.5 w-3.5" />} />
                            <ReadOnlyField label="Email" value={profileData.email} icon={<Mail className="h-3.5 w-3.5" />} />
                            <ReadOnlyField
                                label="Phone"
                                value={profileData.phoneNumber || 'Not provided'}
                                icon={<Phone className="h-3.5 w-3.5" />}
                            />
                        </ProfileSection>

                        <div className="border-t border-gray-100 dark:border-slate-700/70" />

                        <ProfileSection title="Work">
                            <ReadOnlyField
                                label="Job Title"
                                value={profileData.jobTitle || 'Not set'}
                                icon={<Briefcase className="h-3.5 w-3.5" />}
                            />
                            <ReadOnlyField
                                label="Department"
                                value={userData.department || 'Not assigned'}
                                icon={<Users2 className="h-3.5 w-3.5" />}
                            />
                            <ReadOnlyField
                                label="Role"
                                value={roleConfig.label}
                                icon={<Shield className="h-3.5 w-3.5" />}
                            />
                        </ProfileSection>

                        <div className="border-t border-gray-100 dark:border-slate-700/70" />

                        <ProfileSection title="Personal">
                            <ReadOnlyField
                                label="Gender"
                                value={displayGender}
                                icon={<Users2 className="h-3.5 w-3.5" />}
                            />
                            <ReadOnlyField
                                label="Date of Birth"
                                value={birthdayDisplay?.date || 'Not provided'}
                                icon={<CalendarIcon className="h-3.5 w-3.5" />}
                                note={birthdayDisplay?.note}
                            />
                        </ProfileSection>

                        <div className="border-t border-gray-100 dark:border-slate-700/70" />

                        <ProfileSection title="Security">
                            <p className="-mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Your account uses password-based sign-in.
                            </p>
                            <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                                        <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Password protected</p>
                                    </div>
                                </div>
                                {!isChangingPassword && (
                                    <Button
                                        onClick={() => setIsChangingPassword(true)}
                                        variant="outline"
                                        className="h-8 shrink-0 rounded-lg border-rose-200/70 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-500/25 dark:text-rose-300 dark:hover:bg-rose-950/30"
                                    >
                                        Change Password
                                        <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </ProfileSection>
                    </div>
                </div>
            </div>

            {isChangingPassword && (
                <div className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-sm" onClick={closePasswordSheet}>
                    <div
                        className="max-h-[80vh] w-full overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 dark:border-slate-700 dark:bg-slate-800"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-3 sm:px-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your password without leaving this page.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closePasswordSheet}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
                                aria-label="Close password sheet"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[calc(80vh-92px)] overflow-y-auto px-4 pb-5 sm:px-5">
                            <div className="space-y-4">
                                <PasswordInput
                                    label="Current Password"
                                    value={passwordData.currentPassword}
                                    onChange={setPwField('currentPassword')}
                                    show={showCurrentPassword}
                                    onToggle={() => setShowCurrentPassword(p => !p)}
                                    disabled={isChangingPasswordLoading}
                                />

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

                                <p className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                                    <Info className="w-3 h-3 shrink-0" />
                                    Must be at least 8 characters
                                </p>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 dark:border-slate-700">
                                <Button
                                    onClick={closePasswordSheet}
                                    disabled={isChangingPasswordLoading}
                                    variant="outline"
                                    className="h-10 rounded-xl border-gray-200 text-sm text-gray-600 dark:border-slate-700 dark:text-gray-300"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={isChangingPasswordLoading}
                                    className="h-10 rounded-xl bg-rose-600 text-sm text-white shadow-sm hover:bg-rose-700"
                                >
                                    {isChangingPasswordLoading
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Updating…</>
                                        : <><Lock className="w-3.5 h-3.5 mr-1.5" />Update Password</>
                                    }
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-sm" onClick={closeEditSheet}>
                    <div
                        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 dark:border-slate-700 dark:bg-slate-800"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <div className="shrink-0 border-b border-gray-100 px-4 pb-4 pt-3 dark:border-slate-700 sm:px-5">
                            <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your personal details without leaving this page.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeEditSheet}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
                                aria-label="Close edit profile sheet"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-5">
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                <EditableInput label="First Name" value={profileData.firstName} onChange={setField('firstName')} disabled={isSaving} autoComplete="given-name" />
                                <EditableInput label="Last Name" value={profileData.lastName} onChange={setField('lastName')} disabled={isSaving} autoComplete="family-name" />

                                <EditableInput
                                    label="Email Address"
                                    type="email"
                                    value={profileData.email}
                                    onChange={setField('email')}
                                    readOnly
                                    note="Email cannot be changed here"
                                    autoComplete="off"
                                />

                                <EditableInput
                                    label="Phone Number"
                                    type="tel"
                                    value={profileData.phoneNumber}
                                    onChange={setField('phoneNumber')}
                                    disabled={isSaving}
                                    placeholder="+27 xx xxx xxxx"
                                    autoComplete="tel"
                                />

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
                                                    "h-10 w-full justify-start rounded-xl border-gray-200 bg-white text-left text-sm font-normal dark:border-slate-700 dark:bg-slate-700",
                                                    !profileData.dob && "text-gray-400"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-gray-400" />
                                                {profileData.dob ? format(new Date(profileData.dob), "PPP") : <span>Pick a date</span>}
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

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Gender</label>
                                    <select
                                        value={profileData.gender}
                                        onChange={e => setField('gender')(e.target.value)}
                                        disabled={isSaving}
                                        autoComplete="sex"
                                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-700 dark:text-gray-100"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="-">Prefer not to say</option>
                                    </select>
                                </div>

                                <EditableInput
                                    label="Job Title"
                                    value={profileData.jobTitle}
                                    onChange={setField('jobTitle')}
                                    disabled={isSaving}
                                    autoComplete="organization-title"
                                />

                                <EditableInput
                                    label="Department"
                                    value={userData.department || 'Not assigned'}
                                    onChange={() => undefined}
                                    readOnly
                                    note="Department is managed by your administrator"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="shrink-0 border-t border-gray-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95 sm:px-5">
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={closeEditSheet}
                                    disabled={isSaving}
                                    variant="outline"
                                    className="h-10 rounded-xl border-gray-200 text-sm text-gray-600 dark:border-slate-700 dark:text-gray-300"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="h-10 rounded-xl bg-emerald-600 text-sm text-white shadow-sm hover:bg-emerald-700"
                                >
                                    {isSaving
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</>
                                        : <><Save className="w-3.5 h-3.5 mr-1.5" />Save Changes</>
                                    }
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfilePage;
