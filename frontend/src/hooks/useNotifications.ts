import { API_BASE_URL, useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types based on your API response


interface NotificationSettings {
    emailEnabled: boolean;
    emailLeaveRequests: boolean;
    emailDocuments: boolean;
    emailPerformanceReviews: boolean;
    emailSystemUpdates: boolean;
    emailMarketing: boolean;
    inAppEnabled: boolean;
    inAppLeaveRequests: boolean;
    inAppDocuments: boolean;
    inAppPerformanceReviews: boolean;
    inAppSystemUpdates: boolean;
    pushEnabled: boolean;
    pushLeaveRequests: boolean;
    pushDocuments: boolean;
    pushPerformanceReviews: boolean;
    pushSystemUpdates: boolean;
    digestFrequency: 'never' | 'daily' | 'weekly' | 'monthly';
    quietHoursStart?: string;
    quietHoursEnd?: string;
    timezone?: string;
}

interface NotificationFilters {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    priority?: string;
    isRead?: boolean;
    isArchived?: boolean;
    startDate?: string;
    endDate?: string;
}

// API client class
class NotificationAPI_Client {
    private baseUrl: string;
    private getAuthHeaders: () => Record<string, string>;

    constructor(baseUrl: string, getAuthHeaders: () => Record<string, string>) {
        this.baseUrl = baseUrl;
        this.getAuthHeaders = getAuthHeaders;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}/notifications${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    async getNotifications(filters: NotificationFilters = {}) {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value.toString());
            }
        });

        const queryString = params.toString() ? `?${params.toString()}` : '';
        return this.request(`${queryString}`);
    }

    async getNotificationCounts() {
        return this.request('/counts');
    }

    async getNotification(id: string) {
        return this.request(`/${id}`);
    }

    async markAsRead(id: string) {
        return this.request(`/${id}/read`, { method: 'PATCH' });
    }

    async markAsUnread(id: string) {
        return this.request(`/${id}/unread`, { method: 'PATCH' });
    }

    async markAllAsRead() {
        return this.request('/mark-all-read', { method: 'PATCH' });
    }

    async archiveNotification(id: string) {
        return this.request(`/${id}/archive`, { method: 'PATCH' });
    }

    async unarchiveNotification(id: string) {
        return this.request(`/${id}/unarchive`, { method: 'PATCH' });
    }

    async deleteNotification(id: string) {
        return this.request(`/${id}`, { method: 'DELETE' });
    }

    async getSettings() {
        return this.request('/settings');
    }

    async updateSettings(settings: Partial<NotificationSettings>) {
        return this.request('/settings', {
            method: 'PATCH',
            body: JSON.stringify(settings),
        });
    }
}

// Custom hooks
export const useNotifications = (filters: NotificationFilters = {}) => {
    const { user } = useAuth();
    const token: string | null = localStorage.getItem('authToken');

    const api = new NotificationAPI_Client(
        API_BASE_URL,
        () => ({

            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'

        })
    );

    return useQuery({
        queryKey: ['notifications', filters],
        queryFn: () => api.getNotifications(filters),
        enabled: !!user?.id,
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute
    });
};

export const useNotificationCounts = () => {
    const { user } = useAuth();
    const token: string | null = localStorage.getItem('authToken');

    const api = new NotificationAPI_Client(
        API_BASE_URL,
        () => ({

            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'

        })
    );

    return useQuery({
        queryKey: ['notification-counts'],
        queryFn: () => api.getNotificationCounts(),
        enabled: !!user?.id,
        staleTime: 10 * 1000, // 10 seconds
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });
};

export const useNotificationMutations = () => {
    // const { user } = useAuth();
    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    const api = new NotificationAPI_Client(
        API_BASE_URL,
        () => ({

            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'

        })
    );

    const invalidateQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    };

    const markAsRead = useMutation({
        mutationFn: (id: string) => api.markAsRead(id),
        onSuccess: () => {
            invalidateQueries();
        },
        onError: (error) => {
            console.error('Failed to mark notification as read:', error);
        },
    });

    const markAsUnread = useMutation({
        mutationFn: (id: string) => api.markAsUnread(id),
        onSuccess: () => {
            invalidateQueries();
        },
    });

    const markAllAsRead = useMutation({
        mutationFn: () => api.markAllAsRead(),
        onSuccess: () => {
            invalidateQueries();
        },
    });

    const archiveNotification = useMutation({
        mutationFn: (id: string) => api.archiveNotification(id),
        onSuccess: () => {
            invalidateQueries();
        },
    });

    const deleteNotification = useMutation({
        mutationFn: (id: string) => api.deleteNotification(id),
        onSuccess: () => {
            invalidateQueries();
        },
    });

    return {
        markAsRead,
        markAsUnread,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
    };
};

export const useNotificationSettings = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    const api = new NotificationAPI_Client(
        API_BASE_URL,
        () => ({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    );

    const settings = useQuery({
        queryKey: ['notification-settings'],
        queryFn: () => api.getSettings(),
        enabled: !!user?.id,
    });

    const updateSettings = useMutation({
        mutationFn: (newSettings: Partial<NotificationSettings>) =>
            api.updateSettings(newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
        },
    });

    return {
        settings: settings.data?.data,
        isLoading: settings.isLoading,
        error: settings.error,
        updateSettings,
    };
};