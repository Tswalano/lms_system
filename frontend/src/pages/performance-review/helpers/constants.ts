import type { Question } from "../types/types";


// Application constants
export const APP_CONFIG = {
    name: 'Performance Review System',
    version: '1.0.0',
    defaultReviewDuration: 7, // days
    maxReviewRequests: 10,
    minReviewRequests: 1,
} as const;

// Review question templates
export const SELF_REVIEW_QUESTIONS: Question[] = [
    {
        id: 'self-1',
        type: 'self',
        category: 'Technical Skills',
        question: "What was your most impactful technical contribution this period?"
    },
    {
        id: 'self-2',
        type: 'self',
        category: 'Leadership',
        question: "Describe a project where you led the implementation or guided others."
    },
    {
        id: 'self-3',
        type: 'self',
        category: 'Expertise',
        question: "How would you rate your proficiency in your core technical areas? Provide specific examples."
    },
    {
        id: 'self-4',
        type: 'self',
        category: 'Innovation',
        question: "What innovations or improvements have you implemented? What complex challenges have you solved?"
    },
    {
        id: 'self-5',
        type: 'self',
        category: 'Collaboration',
        question: "How have you collaborated with team members and other departments?"
    },
    {
        id: 'self-6',
        type: 'self',
        category: 'Problem Solving',
        question: "Describe a significant technical or process challenge you overcame this period."
    },
    {
        id: 'self-7',
        type: 'self',
        category: 'Growth & Learning',
        question: "What new skills or knowledge have you acquired? How have you applied them?"
    },
    {
        id: 'self-8',
        type: 'self',
        category: 'Future Goals',
        question: "What are your goals for the next quarter? What would you like to improve or learn?"
    }
];

export const PEER_REVIEW_QUESTIONS: Question[] = [
    {
        id: 'peer-1',
        type: 'peer',
        category: 'Team Collaboration',
        question: "Describe a specific instance where this person collaborated effectively with the team."
    },
    {
        id: 'peer-2',
        type: 'peer',
        category: 'Technical Impact',
        question: "How did this person's work impact the team's or company's technical goals this quarter?"
    },
    {
        id: 'peer-3',
        type: 'peer',
        category: 'Problem Solving',
        question: "Provide an example of a challenging problem this person solved."
    },
    {
        id: 'peer-4',
        type: 'peer',
        category: 'Leadership & Mentoring',
        question: "How has this person demonstrated leadership or helped mentor others?"
    },
    {
        id: 'peer-5',
        type: 'peer',
        category: 'Communication',
        question: "How would you rate this person's communication skills? Provide specific examples."
    },
    {
        id: 'peer-6',
        type: 'peer',
        category: 'Innovation & Initiative',
        question: "Describe any innovative approaches or initiatives this person has taken."
    },
    {
        id: 'peer-7',
        type: 'peer',
        category: 'Areas for Growth',
        question: "What areas could this person focus on for professional development?"
    },
    {
        id: 'peer-8',
        type: 'peer',
        category: 'Overall Assessment',
        question: "What are this person's greatest strengths, and how do they contribute to team success?"
    }
];

// Color schemes
export const COLORS = {
    primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
    },
    status: {
        pending: {
            bg: 'bg-yellow-100 dark:bg-yellow-900/20',
            text: 'text-yellow-800 dark:text-yellow-400',
            border: 'border-yellow-200 dark:border-yellow-800'
        },
        'in-progress': {
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            text: 'text-blue-800 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800'
        },
        completed: {
            bg: 'bg-green-100 dark:bg-green-900/20',
            text: 'text-green-800 dark:text-green-400',
            border: 'border-green-200 dark:border-green-800'
        },
        declined: {
            bg: 'bg-red-100 dark:bg-red-900/20',
            text: 'text-red-800 dark:text-red-400',
            border: 'border-red-200 dark:border-red-800'
        }
    }
} as const;

// Animation durations
export const ANIMATIONS = {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
} as const;

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    reviewRequests: 'performance-review-requests',
    userPreferences: 'performance-review-preferences',
    darkMode: 'performance-review-dark-mode',
    draftResponses: 'performance-review-drafts',
} as const;

// API endpoints (for future backend integration)
export const API_ENDPOINTS = {
    reviews: '/api/reviews',
    users: '/api/users',
    teams: '/api/teams',
    notifications: '/api/notifications',
} as const;

// Validation rules
export const VALIDATION = {
    minAnswerLength: 10,
    maxAnswerLength: 5000,
    maxReviewRequestMessage: 500,
    maxTeamMemberSelection: 5,
} as const;

// Messages and text constants
export const MESSAGES = {
    errors: {
        required: 'This field is required',
        minLength: (min: number) => `Minimum ${min} characters required`,
        maxLength: (max: number) => `Maximum ${max} characters allowed`,
        invalidSelection: 'Please make a valid selection',
        networkError: 'Network error occurred. Please try again.',
        unauthorized: 'You are not authorized to perform this action',
        noTeamMembers: 'No team members selected',
        selfReview: 'Cannot request a review from yourself',
    },
    success: {
        reviewSubmitted: 'Review submitted successfully!',
        requestSent: 'Review request sent successfully!',
        statusUpdated: 'Status updated successfully!',
        settingsSaved: 'Settings saved successfully!',
    },
    confirmations: {
        deleteReview: 'Are you sure you want to delete this review?',
        declineRequest: 'Are you sure you want to decline this review request?',
        submitReview: 'Are you sure you want to submit this review?',
    },
    placeholders: {
        searchTeamMembers: 'Search team members...',
        reviewMessage: 'Add a personal message to your review request...',
        reviewAnswer: 'Type your answer here...',
    },
} as const;

// Navigation menu items
export const NAVIGATION = {
    main: [
        { id: 'dashboard', label: 'Dashboard', path: '/' },
        { id: 'review-requests', label: 'Review Requests', path: '/requests' },
        { id: 'self-review', label: 'Self Review', path: '/self-review' },
        { id: 'pending-reviews', label: 'My Requests', path: '/my-requests' },
    ],
    user: [
        { id: 'profile', label: 'Profile', icon: 'User' },
        { id: 'settings', label: 'Settings', icon: 'Settings' },
        { id: 'help', label: 'Help', icon: 'HelpCircle' },
        { id: 'logout', label: 'Sign Out', icon: 'LogOut' },
    ],
} as const;

// Default user preferences
export const DEFAULT_PREFERENCES = {
    theme: 'light' as 'light' | 'dark',
    notifications: {
        email: true,
        browser: true,
        reviewReminders: true,
        deadlineAlerts: true,
    },
    language: 'en',
    timezone: 'UTC',
} as const;

// Review status priorities (for sorting)
export const STATUS_PRIORITY = {
    'pending': 1,
    'in-progress': 2,
    'completed': 3,
    'declined': 4,
} as const;

// File upload constraints
export const FILE_UPLOAD = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFiles: 3,
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
} as const;

// Performance review cycles
export const REVIEW_CYCLES = {
    quarterly: { label: 'Quarterly', months: 3 },
    biannual: { label: 'Bi-Annual', months: 6 },
    annual: { label: 'Annual', months: 12 },
} as const;