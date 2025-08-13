export interface CompletedReview {
    id: string;
    reviewType: 'self' | 'peer';
    revieweeId: number;
    revieweeName: string;
    revieweeRole: string;
    revieweeAvatar: string;
    reviewerId?: number;
    reviewerName?: string;
    reviewerRole?: string;
    reviewerAvatar?: string;
    completedDate: string;
    responses: ReviewResponse[];
    status: 'pending-review' | 'in-discussion' | 'completed' | 'needs-action';
    priority: 'low' | 'medium' | 'high';
    tags: string[];
    notes: AdminNote[];
    scores?: ReviewScores;
}

export interface ReviewResponse {
    questionId: string;
    question: string;
    category: string;
    answer: string;
    score?: number; // 1-5 rating if applicable
    highlightType?: 'strength' | 'improvement' | 'concern' | 'neutral';
}

export interface ReviewScores {
    overall: number;
    technical: number;
    collaboration: number;
    leadership: number;
    communication: number;
    growth: number;
}

export interface AdminNote {
    id: string;
    authorId: number;
    authorName: string;
    content: string;
    createdAt: string;
    type: 'discussion' | 'action-item' | 'concern' | 'highlight';
    resolved?: boolean;
}

export interface ReviewSummary {
    employeeId: number;
    employeeName: string;
    employeeRole: string;
    selfReview?: CompletedReview;
    peerReviews: CompletedReview[];
    managerReview?: CompletedReview;
    overallStatus: 'incomplete' | 'pending-review' | 'in-discussion' | 'completed';
    lastUpdated: string;
    dueDate?: string;
    reviewCycle: string;
}

export interface FeedbackSuggestion {
    id: string;
    reviewId: string;
    type: 'strength' | 'development' | 'goal' | 'recognition';
    category: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    aiGenerated: boolean;
    approved: boolean;
}

export interface DiscussionThread {
    id: string;
    reviewId: string;
    title: string;
    messages: DiscussionMessage[];
    participants: number[];
    status: 'active' | 'resolved' | 'archived';
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
    updatedAt: string;
}

export interface DiscussionMessage {
    id: string;
    authorId: number;
    authorName: string;
    content: string;
    timestamp: string;
    type: 'comment' | 'suggestion' | 'action-item' | 'resolution';
}

export type AdminViewMode = 'overview' | 'individual-review' | 'team-summary' | 'discussions' | 'analytics';

export interface AdminFilters {
    reviewType: 'all' | 'self' | 'peer' | 'manager';
    status: 'all' | 'pending-review' | 'in-discussion' | 'completed' | 'needs-action';
    priority: 'all' | 'low' | 'medium' | 'high';
    department: string[];
    reviewCycle: 'all' | string;
    dateRange: {
        start?: string;
        end?: string;
    };
}

export interface AdminStats {
    totalReviews: number;
    pendingReviews: number;
    inDiscussion: number;
    completedReviews: number;
    averageCompletionTime: number;
    reviewsByDepartment: Record<string, number>;
    reviewsByType: Record<string, number>;
    overdueReviews: number;
}