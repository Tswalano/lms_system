import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from './usePerformanceReview';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type QuestionReviewType = 'self_review' | 'peer_review' | 'manager_appraisal' | 'next_steps';
export type QuestionType = 'text' | 'rating' | 'nomination';
export type QuestionPhase = 'self' | 'peer' | 'nomination';

export interface AdminReviewQuestion {
    id: string;
    category: string;
    subcategory: string | null;
    questionText: string;
    guidanceText: string | null;
    questionType: QuestionType;
    phase: QuestionPhase;
    reviewType: QuestionReviewType;
    targetRole: string | null;
    weight: number | null;
    displayOrder: number;
    isActive: boolean;
    responseCount: number;
    setCount: number;
}

export interface QuestionPayload {
    category: string;
    subcategory?: string | null;
    questionText: string;
    guidanceText?: string | null;
    questionType: QuestionType;
    phase: QuestionPhase;
    reviewType: QuestionReviewType;
    targetRole?: string | null;
    weight?: number | null;
    displayOrder?: number;
}

export interface QuestionSetApi {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    createdAt: string;
    questionCount: number;
    assignmentCount: number;
    questionIds: string[];
}

export interface QuestionSetAssignmentApi {
    id: string;
    employee: { id: string; name: string; role: string };
    questionSet: { id: string; name: string };
    cycle: { id: string; name: string } | null;
    createdAt: string;
}

// ─────────────────────────────────────────────
// Hooks — Questions
// ─────────────────────────────────────────────

export function useReviewQuestions(reviewType?: QuestionReviewType, includeInactive = true) {
    const { user } = useAuth();
    const params = new URLSearchParams();
    if (reviewType) params.set('reviewType', reviewType);
    if (includeInactive) params.set('includeInactive', 'true');
    const qs = params.toString();
    return useQuery<AdminReviewQuestion[]>({
        queryKey: ['review-questions', reviewType ?? 'all', includeInactive],
        queryFn: () => apiFetch(`/performance/questions${qs ? `?${qs}` : ''}`),
        enabled: !!user && user.role === 'admin',
        staleTime: 30_000,
    });
}

export function useCreateQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: QuestionPayload) =>
            apiFetch('/performance/questions', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['review-questions'] }),
    });
}

export function useUpdateQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: Partial<QuestionPayload> & { id: string; isActive?: boolean }) =>
            apiFetch(`/performance/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['review-questions'] });
            qc.invalidateQueries({ queryKey: ['question-sets'] });
        },
    });
}

export function useDeleteQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiFetch<{ softDeleted: boolean }>(`/performance/questions/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['review-questions'] });
            qc.invalidateQueries({ queryKey: ['question-sets'] });
        },
    });
}

export function useReorderQuestions() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (orders: { id: string; displayOrder: number }[]) =>
            apiFetch('/performance/questions/reorder', { method: 'POST', body: JSON.stringify({ orders }) }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['review-questions'] }),
    });
}

// ─────────────────────────────────────────────
// Hooks — Question sets
// ─────────────────────────────────────────────

export function useQuestionSets() {
    const { user } = useAuth();
    return useQuery<QuestionSetApi[]>({
        queryKey: ['question-sets'],
        queryFn: () => apiFetch('/performance/question-sets'),
        enabled: !!user && user.role === 'admin',
        staleTime: 30_000,
    });
}

export function useSaveQuestionSet() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { id?: string; name: string; description?: string | null; isDefault?: boolean }) => {
            const { id, ...body } = data;
            return id
                ? apiFetch(`/performance/question-sets/${id}`, { method: 'PUT', body: JSON.stringify(body) })
                : apiFetch('/performance/question-sets', { method: 'POST', body: JSON.stringify(body) });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['question-sets'] }),
    });
}

export function useDeleteQuestionSet() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiFetch(`/performance/question-sets/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['question-sets'] });
            qc.invalidateQueries({ queryKey: ['question-set-assignments'] });
        },
    });
}

export function useSetQuestionSetMembers() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { setId: string; questionIds: string[] }) =>
            apiFetch(`/performance/question-sets/${data.setId}/questions`, {
                method: 'PUT',
                body: JSON.stringify({ questionIds: data.questionIds }),
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['question-sets'] });
            qc.invalidateQueries({ queryKey: ['review-questions'] });
        },
    });
}

// ─────────────────────────────────────────────
// Hooks — Employee assignments
// ─────────────────────────────────────────────

export function useQuestionSetAssignments(cycleId?: string) {
    const { user } = useAuth();
    return useQuery<QuestionSetAssignmentApi[]>({
        queryKey: ['question-set-assignments', cycleId],
        queryFn: () => apiFetch(`/performance/question-set-assignments${cycleId ? `?cycleId=${cycleId}` : ''}`),
        enabled: !!user && user.role === 'admin',
        staleTime: 30_000,
    });
}

export function useAssignQuestionSet() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { employeeId: string; cycleId?: string | null; questionSetId: string | null }) => {
            const { employeeId, ...body } = data;
            return apiFetch(`/performance/question-set-assignments/${employeeId}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['question-set-assignments'] });
            qc.invalidateQueries({ queryKey: ['question-sets'] });
        },
    });
}
