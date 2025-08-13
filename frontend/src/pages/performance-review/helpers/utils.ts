import type { ReviewRequest, TeamMember } from "../types/types";


// Date formatting utilities
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
};

export const getDaysUntilDue = (dueDateString: string): number => {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffInDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
};

export const isOverdue = (dueDateString: string): boolean => {
    return getDaysUntilDue(dueDateString) < 0;
};

// Review status utilities
export const getStatusColor = (status: ReviewRequest['status']): string => {
    const colors = {
        'pending': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
        'in-progress': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
        'completed': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
        'declined': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
    };
    return colors[status] || colors.pending;
};

export const getStatusText = (status: ReviewRequest['status']): string => {
    const statusTexts = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'declined': 'Declined',
    };
    return statusTexts[status] || 'Unknown';
};

// Review statistics
export const calculateReviewStats = (requests: ReviewRequest[], userId: number) => {
    const requestsForUser = requests.filter(r => r.reviewerId === userId);
    const requestsByUser = requests.filter(r => r.requesterId === userId);

    return {
        pending: requestsForUser.filter(r => r.status === 'pending').length,
        inProgress: requestsForUser.filter(r => r.status === 'in-progress').length,
        completed: requestsForUser.filter(r => r.status === 'completed').length,
        declined: requestsForUser.filter(r => r.status === 'declined').length,
        myRequests: requestsByUser.filter(r => r.status !== 'completed').length,
        totalReceived: requestsForUser.length,
        totalSent: requestsByUser.length,
    };
};

// Team member utilities
export const getTeamMemberById = (members: TeamMember[], id: number): TeamMember | undefined => {
    return members.find(member => member.id === id);
};

export const filterTeamMembers = (members: TeamMember[], query: string): TeamMember[] => {
    if (!query.trim()) return members;

    const lowercaseQuery = query.toLowerCase();
    return members.filter(member =>
        member.name.toLowerCase().includes(lowercaseQuery) ||
        member.role.toLowerCase().includes(lowercaseQuery) ||
        member.department.toLowerCase().includes(lowercaseQuery)
    );
};

// Validation utilities
export const validateReviewRequest = (request: Partial<ReviewRequest>): string[] => {
    const errors: string[] = [];

    if (!request.requesterId) {
        errors.push('Requester ID is required');
    }

    if (!request.reviewerId) {
        errors.push('Reviewer ID is required');
    }

    if (request.requesterId === request.reviewerId) {
        errors.push('Cannot request a review from yourself');
    }

    return errors;
};

export const validateTeamMemberSelection = (selectedIds: number[], minSelection: number = 1, maxSelection?: number): string[] => {
    const errors: string[] = [];

    if (selectedIds.length < minSelection) {
        errors.push(`Please select at least ${minSelection} team member${minSelection > 1 ? 's' : ''}`);
    }

    if (maxSelection && selectedIds.length > maxSelection) {
        errors.push(`Please select no more than ${maxSelection} team member${maxSelection > 1 ? 's' : ''}`);
    }

    return errors;
};

// Data transformation utilities
export const groupReviewsByStatus = (requests: ReviewRequest[]) => {
    return requests.reduce((groups, request) => {
        const status = request.status;
        if (!groups[status]) {
            groups[status] = [];
        }
        groups[status].push(request);
        return groups;
    }, {} as Record<ReviewRequest['status'], ReviewRequest[]>);
};

export const sortReviewsByDate = (requests: ReviewRequest[], field: 'requestDate' | 'dueDate' = 'requestDate', ascending: boolean = false) => {
    return [...requests].sort((a, b) => {
        const dateA = new Date(a[field]).getTime();
        const dateB = new Date(b[field]).getTime();
        return ascending ? dateA - dateB : dateB - dateA;
    });
};

// URL and routing utilities
export const createDeepLink = (view: string, params?: Record<string, string>): string => {
    const baseUrl = window.location.origin;
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    return `${baseUrl}/#/${view}${searchParams ? `?${searchParams}` : ''}`;
};

// Local storage helpers
export const saveToLocalStorage = <T>(key: string, data: T): boolean => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return defaultValue;
    }
};

// Export utilities
export const exportReviewData = (requests: ReviewRequest[], filename: string = 'review-data.json') => {
    const dataStr = JSON.stringify(requests, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = filename;
    link.click();
};

// Random utilities for demo data
export const generateMockReviewRequest = (requester: TeamMember, reviewer: TeamMember): Omit<ReviewRequest, 'id'> => {
    const requestDate = new Date();
    const dueDate = new Date(requestDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const messages = [
        'I would appreciate your feedback on my work this quarter.',
        'Looking forward to your insights on my recent projects.',
        'Could you please review my performance and provide suggestions?',
        'I value your opinion and would like your assessment.',
    ];

    return {
        requesterId: requester.id,
        reviewerId: reviewer.id,
        requesterName: requester.name,
        requesterRole: requester.role,
        requesterAvatar: requester.avatar,
        reviewerName: reviewer.name,
        reviewerRole: reviewer.role,
        reviewerAvatar: reviewer.avatar,
        status: 'pending',
        requestDate: requestDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        message: messages[Math.floor(Math.random() * messages.length)],
        type: 'peer-review'
    };
};