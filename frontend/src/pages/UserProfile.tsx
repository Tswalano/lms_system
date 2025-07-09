import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Edit2, Save, X, Eye, EyeOff, Camera, Loader2, Calendar as CalendarIcon, Users2, Info } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from "date-fns";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

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

const UserProfile: React.FC = () => {
    const { authFetch } = useAuth();
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isChangingPasswordLoading, setIsChangingPasswordLoading] = useState<boolean>(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    const [userData, setUserData] = useState<UserPayload | null>(null);

    // Profile form state
    const [profileData, setProfileData] = useState<ProfileFormData>({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        jobTitle: '',
        gender: '',
        dob: ''
    });

    // Password form state
    const [passwordData, setPasswordData] = useState<PasswordFormData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Fetch user data
    const fetchUserData = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await authFetch('/users/me', {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: UserApiResponse = await response.json();

            if (result.error || result.code !== 'SUCCESS') {
                throw new Error(result.message || 'Failed to fetch user data');
            }

            setUserData(result.payload);
            setProfileData({
                firstName: result.payload.firstName,
                lastName: result.payload.lastName,
                email: result.payload.email,
                phoneNumber: result.payload.phoneNumber,
                jobTitle: result.payload.jobTitle,
                gender: result.payload.gender,
                dob: result.payload.dob || ''
            });

        } catch (error) {
            console.error('Error fetching user data:', error);
            toast.error('Error', {
                description: error instanceof Error ? error.message : 'Failed to load profile data',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleProfileChange = (field: keyof ProfileFormData, value: string): void => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePasswordChange = (field: keyof PasswordFormData, value: string): void => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveProfile = async (): Promise<void> => {

        try {
            setIsSaving(true);

            const response = await authFetch('/users/me/update', {
                method: 'POST',
                body: JSON.stringify({ ...profileData, id: userData?.id })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(result.message || 'Failed to update profile');
            }

            toast.success('Profile Updated', {
                description: 'Your profile has been updated successfully.',
            });

            setIsEditing(false);
            await fetchUserData(); // Refresh data

        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Error', {
                description: error instanceof Error ? error.message : 'Failed to update profile',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (): Promise<void> => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Error', {
                description: 'New passwords do not match.',
            });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Error', {
                description: 'Password must be at least 8 characters long.',
            });
            return;
        }


        try {
            setIsChangingPasswordLoading(true);

            const accessToken = localStorage.getItem('accessToken');

            const response = await authFetch(`/auth/change-password`, {
                method: 'POST',
                body: JSON.stringify({
                    accessToken,
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(result.message || 'Failed to change password');
            }

            toast.success('Password Changed', {
                description: 'Your password has been updated successfully.',
            });

            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setIsChangingPassword(false);

        } catch (error) {
            console.error('Error changing password:', error);
            toast.error('Error', {
                description: error instanceof Error ? error.message : 'Failed to change password',
            });
        } finally {
            setIsChangingPasswordLoading(false);
        }
    };

    const cancelEdit = (): void => {
        if (userData) {
            setProfileData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phoneNumber: userData.phoneNumber,
                jobTitle: userData.jobTitle,
                gender: userData.gender,
                dob: userData.dob || ''
            });
        }
        setIsEditing(false);
    };

    const getInitials = (firstName: string, lastName: string): string => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'Not provided';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getRoleBadgeColor = (role: string): string => {
        switch (role && role.toLowerCase() || '') {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'manager':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
                <div className="flex">
                    <Sidebar />
                    <div className="flex-1 ml-64">
                        <DashboardHeader />
                        <main className="p-8">
                            <div className="px-16 max-w-6xl mx-auto">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
                <div className="flex">
                    <Sidebar />
                    <div className="flex-1 ml-64">
                        <DashboardHeader />
                        <main className="p-8">

                            <div className="px-16 max-w-6xl mx-auto">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12 text-center">
                                    <p className="text-gray-600 dark:text-gray-400">Failed to load profile data.</p>
                                    <Button onClick={fetchUserData} className="mt-4">
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 ml-64">
                    <DashboardHeader />
                    <main className="p-8">
                        <div className="px-16 max-w-6xl mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="mb-8 flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">My Profile</h1>
                                        <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
                                    </div>
                                </div>
                                {!isEditing && (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Profile Card */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                                        <div className="text-center">
                                            <div className="relative inline-block mb-4">
                                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold text-2xl">
                                                        {getInitials(profileData.firstName, profileData.lastName)}
                                                    </span>
                                                </div>
                                                {isEditing && (
                                                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors">
                                                        <Camera className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                                                {profileData.firstName} {profileData.lastName}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-3">{profileData.jobTitle}</p>
                                            <Badge className={getRoleBadgeColor(userData.role)}>
                                                {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Leave Summary */}
                                    {userData.leaveData && userData.leaveData.length > 0 && (
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                                <CalendarIcon className="w-5 h-5" />
                                                Leave Balance
                                            </h4>
                                            <div className="space-y-3">
                                                {userData.leaveData.map((leave, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {leave.leave_type}
                                                        </span>
                                                        <span className="font-bold text-cyan-600 dark:text-cyan-400">
                                                            {leave.leave_count} days
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Profile Details */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Personal Information */}
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Personal Information</h4>
                                            {isEditing && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={cancelEdit}
                                                        variant="outline"
                                                        className="flex items-center bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                                                        type="button"
                                                        size="sm"
                                                        disabled={isSaving}
                                                    >
                                                        <X className="w-4 h-4 mr-2" />
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={handleSaveProfile}
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        disabled={isSaving}
                                                    >
                                                        {isSaving ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="w-4 h-4 mr-2" />
                                                                Save
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    First Name
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={profileData.firstName}
                                                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={isSaving}
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 dark:text-gray-100 py-2">{profileData.firstName}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Last Name
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={profileData.lastName}
                                                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={isSaving}
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 dark:text-gray-100 py-2">{profileData.lastName}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    <Mail className="w-4 h-4 inline mr-2" />
                                                    Email
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                        <Lock className="w-3 h-3 mr-1" />
                                                        Read-only
                                                    </span>
                                                </label>
                                                {isEditing ? (
                                                    <div className="relative">
                                                        <input
                                                            type="email"
                                                            value={profileData.email}
                                                            onChange={(e) => handleProfileChange('email', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent"
                                                            disabled
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <p className="text-gray-600 dark:text-gray-300 py-2 px-3 bg-gray-50 dark:bg-slate-800 rounded-lg opacity-75">
                                                            {profileData.email}
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                    <Info className="w-3 h-3 mr-1" />
                                                    Email address cannot be changed for security reasons
                                                </p>
                                            </div>

                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    <Phone className="w-4 h-4 inline mr-2" />
                                                    Phone Number
                                                </Label>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        value={profileData.phoneNumber}
                                                        onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={isSaving}
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 dark:text-gray-100 py-2">{profileData.phoneNumber || 'Not provided'}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                        <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span>Date of Birth</span>
                                                </Label>

                                                {isEditing ? (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal h-[40px] bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600",
                                                                    !profileData.dob && "text-muted-foreground"
                                                                )}
                                                                disabled={isSaving}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {profileData.dob ? format(new Date(profileData.dob), "PPP") : <span>Pick a date</span>}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={profileData.dob ? new Date(profileData.dob) : undefined}
                                                                onSelect={(date) => {
                                                                    if (date) {
                                                                        handleProfileChange('dob', date.toISOString().split('T')[0]);
                                                                    }
                                                                }}
                                                                initialFocus
                                                                disabled={(date) => date > new Date()}
                                                                captionLayout="dropdown"
                                                                fromYear={1900}
                                                                toYear={new Date().getFullYear()}
                                                                className="rounded-md border"
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : (
                                                    <p className="text-gray-900 dark:text-gray-100 py-2 px-3 h-[40px] flex items-center">
                                                        {profileData.dob ? formatDate(profileData.dob) : 'Not provided'}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                        <Users2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span>Gender</span>
                                                </Label>

                                                {isEditing ? (
                                                    <select
                                                        value={profileData.gender}
                                                        onChange={(e) => handleProfileChange('gender', e.target.value)}
                                                        className="w-full px-3 py-2 h-[40px] border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={isSaving}
                                                    >
                                                        <option value="">Select Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                        <option value="-">Prefer not to say</option>
                                                    </select>
                                                ) : (
                                                    <p className="text-gray-900 dark:text-gray-100 py-2 px-3 h-[40px] flex items-center">
                                                        {profileData.gender === '-' ? 'Not specified' : profileData.gender}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Account Info */}
                                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
                                            <h5 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">Account Information</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Account Created
                                                    </label>
                                                    <p className="text-gray-900 dark:text-gray-100 py-2">{formatDate(userData.createdAt)}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Last Updated
                                                    </label>
                                                    <p className="text-gray-900 dark:text-gray-100 py-2">{formatDate(userData.updatedAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Change */}
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Security</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your password and security settings</p>
                                            </div>
                                            {!isChangingPassword && (
                                                <Button
                                                    onClick={() => setIsChangingPassword(true)}
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900"
                                                >
                                                    <Lock className="w-4 h-4 mr-2" />
                                                    Change Password
                                                </Button>
                                            )}
                                        </div>

                                        {isChangingPassword ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Current Password
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showCurrentPassword ? "text" : "password"}
                                                            value={passwordData.currentPassword}
                                                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            disabled={isChangingPasswordLoading}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        New Password
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showNewPassword ? "text" : "password"}
                                                            value={passwordData.newPassword}
                                                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            disabled={isChangingPasswordLoading}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Confirm New Password
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            value={passwordData.confirmPassword}
                                                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            disabled={isChangingPasswordLoading}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-4">
                                                    <Button
                                                        onClick={() => {
                                                            setIsChangingPassword(false);
                                                            setPasswordData({
                                                                currentPassword: '',
                                                                newPassword: '',
                                                                confirmPassword: ''
                                                            });
                                                        }}
                                                        variant="outline"
                                                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                                                        disabled={isChangingPasswordLoading}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={handleChangePassword}
                                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                        disabled={isChangingPasswordLoading}
                                                    >
                                                        {isChangingPasswordLoading ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                Updating...
                                                            </>
                                                        ) : (
                                                            'Update Password'
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <></>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;