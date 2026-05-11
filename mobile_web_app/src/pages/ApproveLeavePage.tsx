/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Loader2,
  X,
  MessageSquare,
  User,
  Ban,
  Square,
  CheckSquare,
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import ProcessedRequestCompactCard from "@/components/approvals/ProcessedRequestCompactCard";

interface LeaveRequest {
  id: number;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  duration: number;
  leave_comment: string;
  leave_length: "half_day" | "full_day";
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  feedback?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    requests: LeaveRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  action: "approve" | "reject";
  employeeName: string;
  leaveType: string;
  isSubmitting: boolean;
}

type ActiveSheet = "details" | "cancelConfirm" | null;

const BottomSheet = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close sheet"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <section className="fixed inset-x-0 bottom-0 mx-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
        {children}
      </section>
    </div>
  );
};

const DetailField = ({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-900/60">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
      {value}
    </div>
    {note ? (
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {note}
      </div>
    ) : null}
  </div>
);

const CommentModal = ({
  isOpen,
  onClose,
  onSubmit,
  action,
  employeeName,
  leaveType,
  isSubmitting,
}: CommentModalProps) => {
  const [comment, setComment] = useState("");

  useEffect(() => {
    setComment(
      action === "approve"
        ? "Leave approved. Enjoy your time off!"
        : "Leave request has been reviewed and rejected. Please contact your manager for more information.",
    );
  }, [action]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-4 pb-4 pt-3 dark:border-slate-700">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${action === "approve" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}
          >
            {action === "approve" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {action === "approve" ? "Approve Leave" : "Reject Leave"}
            </h3>
            <p className="truncate text-sm text-slate-600 dark:text-slate-400">
              {employeeName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {leaveType}
            </p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          disabled={isSubmitting}
        >
          <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          <MessageSquare className="mr-2 inline h-4 w-4" />
          Comment
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Add a comment for the ${action === "approve" ? "approval" : "rejection"}...`}
          className="min-h-[160px] rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60"
          disabled={isSubmitting}
        />
      </div>
      <div className="border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
        <Button
          onClick={() => onSubmit(comment)}
          className={cn(
            "h-11 w-full rounded-2xl text-white",
            action === "approve"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700",
          )}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {action === "approve" ? "Approving..." : "Rejecting..."}
            </>
          ) : (
            <>
              {action === "approve" ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {action === "approve" ? "Approve Request" : "Reject Request"}
            </>
          )}
        </Button>
      </div>
    </BottomSheet>
  );
};

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  action: "approve" | "reject";
  selectedRequests: LeaveRequest[];
  isSubmitting: boolean;
}

const BulkActionModal = ({
  isOpen,
  onClose,
  onSubmit,
  action,
  selectedRequests,
  isSubmitting,
}: BulkActionModalProps) => {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFeedback(
        action === "approve"
          ? "Leave approved. Enjoy your time off!"
          : "Leave request has been reviewed and rejected. Please contact your manager for more information.",
      );
    }
  }, [isOpen, action]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-4 pb-4 pt-3 dark:border-slate-700">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${action === "approve" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}
          >
            {action === "approve" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Bulk {action === "approve" ? "Approve" : "Reject"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {selectedRequests.length} request
              {selectedRequests.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          disabled={isSubmitting}
        >
          <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <div className="space-y-2">
          {selectedRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-900/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                  {request.firstName} {request.lastName}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {request.leave_type}
                </p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {request.duration} day{request.duration !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            <MessageSquare className="mr-2 inline h-4 w-4" />
            Feedback
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[140px] rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
        <Button
          onClick={() => onSubmit(feedback)}
          className={cn(
            "h-11 w-full rounded-2xl text-white",
            action === "approve"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700",
          )}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {action === "approve" ? "Approving..." : "Rejecting..."}
            </>
          ) : (
            <>
              {action === "approve" ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {action === "approve"
                ? `Approve ${selectedRequests.length}`
                : `Reject ${selectedRequests.length}`}
            </>
          )}
        </Button>
      </div>
    </BottomSheet>
  );
};

const ApproveLeavePage = () => {
  const { authFetch } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [modalAction, setModalAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sheetRequest, setSheetRequest] = useState<LeaveRequest | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const sheetHistoryActive = useRef(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject">("approve");

  const queryClient = useQueryClient();
  const token: string | null = localStorage.getItem("authToken");

  const fetchLeaveRequests = async (): Promise<LeaveRequest[]> => {
    if (!token) throw new Error("Unauthorized");

    const response = await authFetch("/leave/all-leave-requests", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result: ApiResponse = await response.json();
    if (!result.success)
      throw new Error(result.message || "Failed to fetch leave requests");

    return result.data.requests;
  };

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["leaveApprovalRequests"],
    queryFn: fetchLeaveRequests,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  const pendingRequests = requests.filter(
    (req) => req.status.toLowerCase() === "pending",
  );
  const processedRequests = requests.filter(
    (req) => req.status.toLowerCase() !== "pending",
  );
  const approvedCount = processedRequests.filter(
    (req) => req.status === "approved",
  ).length;
  const recentProcessedRequests = [...processedRequests]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);
  const pendingPagination = usePagination(pendingRequests, 5);

  const processLeaveMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
      comment,
    }: {
      requestId: number;
      action: "approve" | "reject";
      comment: string;
    }) => {
      if (!token) throw new Error("Unauthorized");
      const response = await authFetch(`/leave/${requestId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, feedback: comment }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || `Failed to ${action} leave request`);
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leaveApprovalRequests"] });
      queryClient.invalidateQueries({ queryKey: ["teamAvailability"] });
      queryClient.invalidateQueries({ queryKey: ["leaveCalendar"] });
      const status = variables.action === "approve" ? "Approved" : "Rejected";
      toast(`Leave ${status}`, {
        description: `The leave request has been ${status.toLowerCase()} successfully.`,
      });
      setIsModalOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Something went wrong",
      });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({
      ids,
      action,
      feedback,
    }: {
      ids: number[];
      action: "approve" | "reject";
      feedback: string;
    }) => {
      if (!token) throw new Error("Unauthorized");
      const response = await authFetch("/leave/bulk-action", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leaveIds: ids, action, feedback }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "Bulk action failed");
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leaveApprovalRequests"] });
      queryClient.invalidateQueries({ queryKey: ["teamAvailability"] });
      queryClient.invalidateQueries({ queryKey: ["leaveCalendar"] });
      setIsBulkModalOpen(false);
      setSelectedIds(new Set());

      const { succeeded, failed } = data.data;
      if (failed === 0) {
        toast.success("Bulk action complete", { description: data.message });
      } else {
        toast.warning("Bulk action partial", {
          description: `${succeeded} succeeded, ${failed} failed. Failed requests remain pending.`,
        });
      }
    },
    onError: (error) => {
      toast.error("Bulk action failed", {
        description:
          error instanceof Error ? error.message : "Something went wrong",
      });
    },
  });

  const cancelLeaveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      if (!token) throw new Error("Unauthorized");
      const response = await authFetch(`/leave/${requestId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "Failed to cancel leave request");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveApprovalRequests"] });
      queryClient.invalidateQueries({ queryKey: ["teamAvailability"] });
      queryClient.invalidateQueries({ queryKey: ["leaveCalendar"] });
      toast.success("Leave Cancelled", {
        description: "The approved leave has been cancelled successfully.",
      });
      sheetHistoryActive.current = false;
      setActiveSheet(null);
      setSheetRequest(null);
    },
    onError: (error) => {
      toast.error("Cancellation Failed", {
        description:
          error instanceof Error ? error.message : "Failed to cancel leave",
      });
    },
  });

  const openApprovalModal = (
    request: LeaveRequest,
    action: "approve" | "reject",
  ) => {
    setSelectedRequest(request);
    setModalAction(action);
    setIsModalOpen(true);
  };

  const closeActiveSheet = () => {
    if (sheetHistoryActive.current) {
      window.history.back();
      return;
    }

    setActiveSheet(null);
    setSheetRequest(null);
  };

  const openDetailsModal = (request: LeaveRequest) => {
    setSheetRequest(request);
    setActiveSheet("details");
  };

  const handleCancelLeave = (request: LeaveRequest) => {
    setSheetRequest(request);
    setActiveSheet("cancelConfirm");
  };

  useEffect(() => {
    if (activeSheet && !sheetHistoryActive.current) {
      window.history.pushState({ approvalsSheet: true }, "");
      sheetHistoryActive.current = true;
    }
  }, [activeSheet]);

  useEffect(() => {
    const handlePopState = () => {
      if (!sheetHistoryActive.current) return;

      sheetHistoryActive.current = false;
      setActiveSheet(null);
      setSheetRequest(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Checkbox helpers
  const allPendingSelected =
    pendingRequests.length > 0 &&
    pendingRequests.every((r) => selectedIds.has(r.id));
  const somePendingSelected = pendingRequests.some((r) =>
    selectedIds.has(r.id),
  );

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openBulkModal = (action: "approve" | "reject") => {
    setBulkAction(action);
    setIsBulkModalOpen(true);
  };

  const handleBulkSubmit = (feedback: string) => {
    bulkActionMutation.mutate({
      ids: Array.from(selectedIds),
      action: bulkAction,
      feedback,
    });
  };

  const isFutureLeave = (r: LeaveRequest) =>
    new Date(r.start_date) > new Date(new Date().toDateString());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Unauthorized
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access leave approvals.
          </p>
        </div>
      </div>
    );
  }

  const selectedRequests = pendingRequests.filter((r) => selectedIds.has(r.id));
  const summaryStats = [
    {
      label: "Pending",
      value: pendingRequests.length,
      helper: "awaiting review",
      className:
        "border-amber-200/70 bg-amber-50/75 dark:border-amber-900/40 dark:bg-amber-950/20",
    },
    {
      label: "Approved",
      value: approvedCount,
      helper: "approved",
      className:
        "border-emerald-200/70 bg-emerald-50/75 dark:border-emerald-900/40 dark:bg-emerald-950/20",
    },
    {
      label: "Total",
      value: requests.length,
      helper: "all requests",
      className:
        "border-cyan-200/70 bg-cyan-50/75 dark:border-cyan-900/40 dark:bg-cyan-950/20",
    },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <MobilePageHeader className="mb-4" />
      <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_18px_48px_rgba(2,6,23,0.28)] md:p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
                <CheckCircle className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-semibold text-slate-950 dark:text-gray-100 md:text-2xl">
                Leave Approvals
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Review and process employee leave requests.
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 md:mt-4 md:gap-3">
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "min-w-0 rounded-2xl border px-3 py-2.5 shadow-sm",
                stat.className,
              )}
            >
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-100 md:text-2xl">
                {stat.value}
              </p>
              <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
                {stat.helper}
              </p>
            </div>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="mt-6 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-10 text-center shadow-[0_18px_48px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-800">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading leave requests...
          </p>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-10 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
          <p className="mb-2 font-medium text-slate-900 dark:text-slate-100">
            Error loading requests
          </p>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Button
            onClick={() => refetch()}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <section className="mt-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
                  Pending Requests
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {pendingRequests.length} request
                  {pendingRequests.length === 1 ? "" : "s"} waiting for review
                </p>
              </div>
              {pendingRequests.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {allPendingSelected ? (
                    <CheckSquare className="h-4 w-4 text-blue-500" />
                  ) : somePendingSelected ? (
                    <CheckSquare className="h-4 w-4 text-blue-300" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {allPendingSelected ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>

            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingPagination.paginatedItems.map((request) => {
                  const isSelected = selectedIds.has(request.id);
                  return (
                    <article
                      key={request.id}
                      className={cn(
                        "rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all dark:border-slate-700 dark:bg-slate-800",
                        isSelected
                          ? "ring-2 ring-blue-200 dark:ring-blue-900/60"
                          : "",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleSelect(request.id)}
                          className="mt-1 flex-shrink-0 text-slate-400 transition-colors hover:text-blue-500"
                          aria-label={isSelected ? "Deselect" : "Select"}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
                                {request.firstName[0]}
                                {request.lastName[0]}
                              </div>
                                                            <div className="min-w-0 space-y-2">
                                                                <h3 className="truncate text-[15px] font-semibold leading-5 text-slate-950 dark:text-slate-100">
                                                                    {request.firstName} {request.lastName}
                                                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Badge className="h-6 rounded-full bg-cyan-100 px-2.5 text-[11px] font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                                    {request.leave_type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                                                        <div className="flex max-w-[8.5rem] flex-col items-end text-right">
                                                            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                                {request.jobTitle || request.email}
                                                            </p>
                                                            <Badge className="mt-1.5 h-6 rounded-full bg-amber-100 px-2.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                                Pending
                                                            </Badge>
                                                        </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-2.5 dark:border-slate-700 dark:bg-slate-700/40">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Dates
                              </p>
                              <p className="mt-1 text-sm font-medium leading-5 text-slate-900 dark:text-slate-100">
                                {formatDate(request.start_date)} -{" "}
                                {formatDate(request.end_date)}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-2.5 dark:border-slate-700 dark:bg-slate-700/40">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Duration
                              </p>
                              <p className="mt-1 text-sm font-medium leading-5 text-slate-900 dark:text-slate-100">
                                {request.duration} day
                                {request.duration !== 1 ? "s" : ""} •{" "}
                                {request.leave_length === "half_day"
                                  ? "Half Day"
                                  : "Full Day"}
                              </p>
                            </div>
                          </div>

                          {request.leave_comment ? (
                            <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900/60">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Employee Comment
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                                "{request.leave_comment}"
                              </p>
                            </div>
                          ) : null}

                          <div className="mt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openApprovalModal(request, "approve")
                                }
                                className="h-9 rounded-2xl border-green-200 bg-green-50 text-green-600 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                                disabled={processLeaveMutation.isPending}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openApprovalModal(request, "reject")
                                }
                                className="h-9 rounded-2xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                disabled={processLeaveMutation.isPending}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDetailsModal(request)}
                              className="h-9 w-full rounded-2xl border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                <Pagination
                  currentPage={pendingPagination.page}
                  totalPages={pendingPagination.totalPages}
                  pageSize={pendingPagination.pageSize}
                  totalItems={pendingPagination.totalItems}
                  onPageChange={pendingPagination.setPage}
                  onPageSizeChange={pendingPagination.setPageSize}
                  className="mt-2 rounded-2xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-10 text-center dark:border-slate-700 dark:bg-slate-800">
                <Clock className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  No pending leave requests
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  All requests have been processed.
                </p>
              </div>
            )}
          </section>

          {processedRequests.length > 0 && (
            <section className="mt-8">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
                    Recently Processed
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {recentProcessedRequests.length} of{" "}
                    {processedRequests.length}
                  </p>
                </div>
                <Link
                  to="/approve-leave/processed"
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-3.5 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-950/50 sm:w-auto sm:self-end"
                >
                  View all processed requests
                </Link>
              </div>

              {recentProcessedRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentProcessedRequests.map((request) => (
                    <ProcessedRequestCompactCard
                      key={request.id}
                      request={request}
                      formatDate={formatDate}
                      onOpenDetails={(item) =>
                        openDetailsModal(item as LeaveRequest)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    No processed requests yet
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Processed approvals will appear here once requests are
                    reviewed.
                  </p>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed inset-x-4 bottom-24 z-40 mx-auto w-[calc(100%-2rem)] max-w-2xl rounded-[1.5rem] border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {selectedIds.size} selected
            </span>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Button
                size="sm"
                onClick={() => openBulkModal("approve")}
                className="h-10 rounded-2xl bg-green-600 hover:bg-green-700 text-white gap-1.5"
                disabled={bulkActionMutation.isPending}
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              <Button
                size="sm"
                onClick={() => openBulkModal("reject")}
                className="h-10 rounded-2xl bg-red-600 hover:bg-red-700 text-white gap-1.5"
                disabled={bulkActionMutation.isPending}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="self-end text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200 sm:self-auto"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Single approval modal */}
      <CommentModal
        isOpen={isModalOpen}
        onClose={() => {
          if (!processLeaveMutation.isPending) {
            setIsModalOpen(false);
            setSelectedRequest(null);
          }
        }}
        onSubmit={(comment) => {
          if (selectedRequest)
            processLeaveMutation.mutate({
              requestId: selectedRequest.id,
              action: modalAction,
              comment,
            });
        }}
        action={modalAction}
        employeeName={
          selectedRequest
            ? `${selectedRequest.firstName} ${selectedRequest.lastName}`
            : ""
        }
        leaveType={selectedRequest?.leave_type || ""}
        isSubmitting={processLeaveMutation.isPending}
      />

      {/* Bulk action modal */}
      <BulkActionModal
        isOpen={isBulkModalOpen}
        onClose={() => {
          if (!bulkActionMutation.isPending) setIsBulkModalOpen(false);
        }}
        onSubmit={handleBulkSubmit}
        action={bulkAction}
        selectedRequests={selectedRequests}
        isSubmitting={bulkActionMutation.isPending}
      />

      {/* Cancel Confirmation Modal */}
      {activeSheet === "cancelConfirm" &&
        sheetRequest &&
        sheetRequest.status === "approved" &&
        handleCanCancel(sheetRequest) && (
          <BottomSheet
            isOpen={activeSheet === "cancelConfirm"}
            onClose={() => {
              if (!cancelLeaveMutation.isPending) {
                closeActiveSheet();
              }
            }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-4 pb-4 pt-3 dark:border-slate-700">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <Ban className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Cancel Approved Leave
                  </h3>
                  <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                    {sheetRequest.firstName} {sheetRequest.lastName}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!cancelLeaveMutation.isPending) {
                    closeActiveSheet();
                  }
                }}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                disabled={cancelLeaveMutation.isPending}
              >
                <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                This action cannot be undone. Confirm if you want to cancel this
                approved leave request.
              </p>
              <div className="mt-4 grid gap-3">
                <DetailField
                  label="Leave Type"
                  value={sheetRequest.leave_type}
                />
                <DetailField
                  label="Date Range"
                  value={`${formatDate(sheetRequest.start_date)} - ${formatDate(sheetRequest.end_date)}`}
                />
              </div>
            </div>
            <div className="border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
              <Button
                onClick={() => cancelLeaveMutation.mutate(sheetRequest.id)}
                className="h-11 w-full rounded-2xl bg-red-600 text-white hover:bg-red-700"
                disabled={cancelLeaveMutation.isPending}
              >
                {cancelLeaveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel Leave
                  </>
                )}
              </Button>
            </div>
          </BottomSheet>
        )}

      {/* Leave Details Modal */}
      {activeSheet === "details" && sheetRequest && (
        <BottomSheet
          isOpen={activeSheet === "details"}
          onClose={closeActiveSheet}
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-4 pb-4 pt-3 dark:border-slate-700">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                  {sheetRequest.leave_type}
                </h3>
                <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                  {sheetRequest.firstName} {sheetRequest.lastName}
                </p>
              </div>
            </div>
            <Button
              onClick={closeActiveSheet}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
            >
              <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label="Employee"
                value={`${sheetRequest.firstName} ${sheetRequest.lastName}`}
                note={sheetRequest.jobTitle || sheetRequest.email}
              />
              <DetailField
                label="Status"
                value={
                  <Badge className={getStatusColor(sheetRequest.status)}>
                    {sheetRequest.status.charAt(0).toUpperCase() +
                      sheetRequest.status.slice(1)}
                  </Badge>
                }
              />
              <DetailField
                label="Start Date"
                value={formatDate(sheetRequest.start_date)}
              />
              <DetailField
                label="End Date"
                value={formatDate(sheetRequest.end_date)}
              />
              <DetailField label="Leave Type" value={sheetRequest.leave_type} />
              <DetailField
                label="Duration"
                value={`${sheetRequest.duration} day${sheetRequest.duration > 1 ? "s" : ""}${sheetRequest.leave_length === "half_day" ? " (Half Day)" : ""}`}
              />
              <DetailField
                label="Applied Date"
                value={formatDate(sheetRequest.createdAt)}
              />
            </div>
            {sheetRequest.leave_comment ? (
              <div className="mt-4">
                <DetailField
                  label="Employee Comment"
                  value={sheetRequest.leave_comment}
                />
              </div>
            ) : null}
            {sheetRequest.feedback ? (
              <div className="mt-4">
                <DetailField
                  label="Manager Feedback"
                  value={sheetRequest.feedback}
                />
              </div>
            ) : null}
          </div>
          {sheetRequest.status === "pending" ||
          (sheetRequest.status === "approved" &&
            handleCanCancel(sheetRequest)) ? (
            <div className="border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
              {sheetRequest.status === "pending" ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeActiveSheet();
                      openApprovalModal(sheetRequest, "approve");
                    }}
                    className="h-11 rounded-2xl border-green-200 bg-green-50 text-green-600 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeActiveSheet();
                      openApprovalModal(sheetRequest, "reject");
                    }}
                    className="h-11 rounded-2xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              ) : null}
              {sheetRequest.status === "approved" &&
              handleCanCancel(sheetRequest) ? (
                <Button
                  onClick={() => handleCancelLeave(sheetRequest)}
                  className="h-11 w-full rounded-2xl bg-red-600 text-white hover:bg-red-700"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel Leave
                </Button>
              ) : null}
            </div>
          ) : null}
        </BottomSheet>
      )}
    </div>
  );
};

export default ApproveLeavePage;
