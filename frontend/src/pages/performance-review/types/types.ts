export interface TeamMember {
    id: number;
    name: string;
    role: string;
    avatar: string;
    department: string;
}

export interface ReviewRequest {
    id: string;
    requesterId: number;
    reviewerId: number;
    requesterName: string;
    requesterRole: string;
    requesterAvatar: string;
    reviewerName: string;
    reviewerRole: string;
    reviewerAvatar: string;
    status: 'pending' | 'in-progress' | 'completed' | 'declined';
    requestDate: string;
    dueDate: string;
    message?: string;
    type: 'peer-review' | 'self-review-request';
}

export interface Question {
    id: string;
    type: 'self' | 'peer' | 'nomination';
    question: string;
    category: string;
}

export interface Response {
    questionId: string;
    answer: string | number | { memberId: number; reason: string };
}

export type ViewMode = 'dashboard' | 'request-review' | 'self-review' | 'review-requests' | 'pending-reviews' | 'conduct-review' | 'admin';