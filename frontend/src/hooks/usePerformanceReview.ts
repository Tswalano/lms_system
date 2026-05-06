import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, useAuth } from '@/contexts/AuthContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ReviewCycleApi {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'draft' | 'active' | 'closed';
    createdAt: string;
    employeeCount: number;
    nominatedCount: number;
    submittedCount: number;
    avgFinalScore: number | null;
}

export interface PeerAssignmentApi {
    assignmentId: string;
    cycleId: string;
    cycleName: string;
    status: 'pending' | 'in_progress' | 'completed';
    reviewee: { id: string; name: string; role: string };
}

export interface PeerReviewDetailApi {
    assignmentId: string;
    reviewId?: string;
    status: 'pending' | 'in_progress' | 'completed';
    reviewee: { id: string; name: string; role: string };
    cycle: { id: string; name: string };
    questions: { id: string; category: string; questionText: string; guidanceText: string | null }[];
    responses: { questionId: string; ratingResponse: number | null; textResponse: string | null }[];
}

export interface ReviewQuestion {
    id: string;
    category: string;
    questionText: string;
    guidanceText: string | null;
    response: { ratingResponse: number | null; textResponse: string | null } | null;
}

export interface MyReviewsApi {
    selfReview: {
        id: string;
        status: string;
        selfQuestions: ReviewQuestion[];
        nextStepsQuestions: ReviewQuestion[];
    } | null;
    peerAssignments: PeerAssignmentApi[];
}

export interface AdminSummaryItemApi {
    employee: { id: string; name: string; role: string; systemRole: string };
    managerReviewId: string | null;
    managerId: string | null;
    managerScore: number | null;
    peerScore: number | null;
    selfScore: number | null;
    finalScore: number | null;
    nominatedPeers: number;
    reviewStatus: string;
}

export interface SubmissionsApi {
    employee: { id: string; name: string; role: string };
    managerReview: {
        id: string;
        status: string;
        responses: { questionId: string; ratingResponse: number | null; textResponse: string | null; question: { category: string; subcategory: string | null } }[];
    } | null;
    selfReview: {
        id: string;
        status: string;
        responses: { questionId: string; ratingResponse: number | null; textResponse: string | null; question: { category: string; questionText: string } }[];
    } | null;
    peerAssignments: {
        assignmentId: string;
        status: string;
        reviewer: { id: string; name: string; role: string };
        review: {
            id: string;
            responses: { questionId: string; ratingResponse: number | null; overrideRating: number | null; question: { category: string } }[];
        } | null;
    }[];
    scores: {
        managerScore: number | null;
        peerScore: number | null;
        selfScore: number | null;
        finalScore: number | null;
    };
}

export interface ManagerAppraisalItemApi {
    reviewId: string;
    status: string;
    cycleId: string | null;
    cycleName: string;
    employee: { id: string; name: string; role: string };
}

export interface ManagerAppraisalQuestion {
    id: string;
    category: string;
    subcategory: string | null;
    questionText: string;
    guidanceText: string | null;
    response: { ratingResponse: number | null; textResponse: string | null } | null;
}

export interface ManagerAppraisalDetailApi {
    reviewId: string;
    status: string;
    cycle: { id: string; name: string };
    employee: { id: string; name: string; role: string };
    questions: ManagerAppraisalQuestion[];
}

// ─────────────────────────────────────────────
// Auth headers helper
// ─────────────────────────────────────────────

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: { ...authHeaders(), ...(options?.headers ?? {}) },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? 'Request failed');
    return json.data as T;
}

// ─────────────────────────────────────────────
// Hooks — Read
// ─────────────────────────────────────────────

export function usePerformanceCycles() {
    const { user } = useAuth();
    return useQuery<ReviewCycleApi[]>({
        queryKey: ['performance-cycles'],
        queryFn: () => apiFetch('/performance/cycles'),
        enabled: !!user,
        staleTime: 30_000,
    });
}

export function useAdminPerformanceSummary(cycleId?: string) {
    const { user } = useAuth();
    return useQuery<AdminSummaryItemApi[]>({
        queryKey: ['performance-admin-summary', cycleId],
        queryFn: () => apiFetch(`/performance/admin/summary${cycleId ? `?cycleId=${cycleId}` : ''}`),
        enabled: !!user && (user.role === 'admin' || user.role === 'manager'),
        staleTime: 30_000,
    });
}

export function useMyPerformanceReview(cycleId?: string) {
    const { user } = useAuth();
    return useQuery<MyReviewsApi>({
        queryKey: ['my-performance-review', cycleId],
        queryFn: () => apiFetch(`/performance/my-reviews${cycleId ? `?cycleId=${cycleId}` : ''}`),
        enabled: !!user,
        staleTime: 30_000,
    });
}

export function useMyPeerAssignments(cycleId?: string) {
    const { user } = useAuth();
    return useQuery<PeerAssignmentApi[]>({
        queryKey: ['my-peer-assignments', cycleId],
        queryFn: () => apiFetch(`/performance/my-peer-assignments${cycleId ? `?cycleId=${cycleId}` : ''}`),
        enabled: !!user,
        staleTime: 30_000,
    });
}

export function usePeerReviewDetail(assignmentId?: string) {
    const { user } = useAuth();
    return useQuery<PeerReviewDetailApi>({
        queryKey: ['peer-review-detail', assignmentId],
        queryFn: () => apiFetch(`/performance/peer-review/${assignmentId}`),
        enabled: !!user && !!assignmentId,
        staleTime: 30_000,
    });
}

export function usePerformanceSubmissions(employeeId?: string, cycleId?: string) {
    const { user } = useAuth();
    return useQuery<SubmissionsApi>({
        queryKey: ['performance-submissions', employeeId, cycleId],
        queryFn: () => apiFetch(`/performance/submissions/${employeeId}${cycleId ? `?cycleId=${cycleId}` : ''}`),
        enabled: !!user && !!employeeId,
        staleTime: 30_000,
    });
}

export function useManagerReviews(cycleId?: string) {
    const { user } = useAuth();
    return useQuery<ManagerAppraisalItemApi[]>({
        queryKey: ['manager-reviews', cycleId],
        queryFn: () => apiFetch(`/performance/manager-reviews${cycleId ? `?cycleId=${cycleId}` : ''}`),
        enabled: !!user,
        staleTime: 30_000,
    });
}

export function useManagerAppraisalDetail(reviewId?: string) {
    const { user } = useAuth();
    return useQuery<ManagerAppraisalDetailApi>({
        queryKey: ['manager-appraisal-detail', reviewId],
        queryFn: () => apiFetch(`/performance/manager-review/${reviewId}`),
        enabled: !!user && !!reviewId,
        staleTime: 30_000,
    });
}

// ─────────────────────────────────────────────
// Hooks — Mutations
// ─────────────────────────────────────────────

export function useCreateCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; startDate: string; endDate: string }) =>
            apiFetch('/performance/cycles', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-cycles'] }),
    });
}

export function useActivateCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (cycleId: string) =>
            apiFetch(`/performance/cycles/${cycleId}/activate`, { method: 'POST' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['performance-cycles'] });
            qc.invalidateQueries({ queryKey: ['performance-admin-summary'] });
            qc.invalidateQueries({ queryKey: ['my-performance-review'] });
            qc.invalidateQueries({ queryKey: ['my-peer-assignments'] });
            qc.invalidateQueries({ queryKey: ['manager-reviews'] });
        },
    });
}

export function useCloseCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (cycleId: string) =>
            apiFetch(`/performance/cycles/${cycleId}/close`, { method: 'POST' }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-cycles'] }),
    });
}

export interface NominationAssignment {
    assignmentId: string;
    reviewerId: string;
    status: string;
    canRemove: boolean;
}

export function useEmployeeNominations(employeeId?: string, cycleId?: string) {
    const { user } = useAuth();
    return useQuery<NominationAssignment[]>({
        queryKey: ['employee-nominations', employeeId, cycleId],
        queryFn: () => apiFetch(`/performance/nominations/${employeeId}${cycleId ? `?cycleId=${cycleId}` : ''}`),
        enabled: !!user && !!employeeId,
        staleTime: 30_000,
    });
}

export function useSetNominations() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { employeeId: string; cycleId: string; peerIds: string[] }) => {
            const { employeeId, ...body } = data;
            return apiFetch(`/performance/nominations/${employeeId}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            });
        },
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['employee-nominations', vars.employeeId] });
            qc.invalidateQueries({ queryKey: ['performance-admin-summary'] });
            qc.invalidateQueries({ queryKey: ['performance-cycles'] });
        },
    });
}

export function useSyncCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (cycleId: string) =>
            apiFetch(`/performance/cycles/${cycleId}/sync`, { method: 'POST' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['performance-cycles'] });
            qc.invalidateQueries({ queryKey: ['performance-admin-summary'] });
            qc.invalidateQueries({ queryKey: ['my-performance-review'] });
            qc.invalidateQueries({ queryKey: ['my-peer-assignments'] });
            qc.invalidateQueries({ queryKey: ['manager-reviews'] });
        },
    });
}

export function useSaveResponse() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            reviewId: string;
            questionId: string;
            ratingResponse?: number | null;
            textResponse?: string | null;
            reviewerType?: 'self' | 'peer' | 'manager';
        }) => apiFetch('/performance/responses', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['my-performance-review'] });
            qc.invalidateQueries({ queryKey: ['peer-review-detail'] });
            qc.invalidateQueries({ queryKey: ['manager-appraisal-detail'] });
        },
    });
}

export function useSubmitReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reviewId: string) =>
            apiFetch(`/performance/reviews/${reviewId}/submit`, { method: 'POST' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['my-performance-review'] });
            qc.invalidateQueries({ queryKey: ['my-peer-assignments'] });
            qc.invalidateQueries({ queryKey: ['peer-review-detail'] });
            qc.invalidateQueries({ queryKey: ['manager-appraisal-detail'] });
            qc.invalidateQueries({ queryKey: ['manager-reviews'] });
            qc.invalidateQueries({ queryKey: ['performance-admin-summary'] });
        },
    });
}

export interface CycleExportApi {
    cycle: { id: string; name: string; startDate: string; endDate: string };
    employees: {
        employeeName: string;
        jobTitle: string;
        managerScore: number | null;
        peerScore: number | null;
        selfScore: number | null;
        finalScore: number | null;
        managerFeedback: { category: string; subcategory: string; rating: number | null; notes: string }[];
        selfFeedback: { category: string; questionText: string; response: string }[];
        peerFeedback: { reviewerName: string; category: string; rating: number | null }[];
    }[];
}

export function useCycleExport(cycleId?: string) {
    const { user } = useAuth();
    return useQuery<CycleExportApi>({
        queryKey: ['cycle-export', cycleId],
        queryFn: () => apiFetch(`/performance/cycles/${cycleId}/export`),
        enabled: !!user && !!cycleId,
        staleTime: 60_000,
    });
}

export function useSaveOverrides() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            employeeId: string;
            cycleId: string;
            peerOverrides?: { reviewerId: string; questionId: string; value: number | null; overrideNote?: string }[];
            selfOverrides?: { questionId: string; value: number | null }[];
            selfOverrideNote?: string;
        }) => {
            const { employeeId, ...body } = data;
            return apiFetch(`/performance/submissions/${employeeId}/override`, {
                method: 'POST',
                body: JSON.stringify(body),
            });
        },
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['performance-submissions', vars.employeeId] });
            qc.invalidateQueries({ queryKey: ['performance-admin-summary'] });
        },
    });
}
