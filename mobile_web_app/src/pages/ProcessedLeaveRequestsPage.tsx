import { useMemo, useState } from "react";
import { ArrowLeft, Ban, Loader2, Search, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { cn } from "@/lib/utils";
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
  };
}

type StatusFilter = "all" | "approved" | "cancelled";
type SortOrder = "newest" | "oldest";

const ProcessedLeaveRequestsPage = () => {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("authToken");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState<LeaveRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [leaveToCancel, setLeaveToCancel] = useState<LeaveRequest | null>(null);

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
    if (!result.success) throw new Error(result.message || "Failed to fetch leave requests");

    return result.data.requests;
  };

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["leaveApprovalRequests"],
    queryFn: fetchLeaveRequests,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  const cancelLeaveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      if (!token) throw new Error("Unauthorized");
      const response = await authFetch(`/leave/${requestId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to cancel leave request");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveApprovalRequests"] });
      queryClient.invalidateQueries({ queryKey: ["teamAvailability"] });
      queryClient.invalidateQueries({ queryKey: ["leaveCalendar"] });
      toast.success("Leave Cancelled", {
        description: "The approved leave has been cancelled successfully.",
      });
      setShowCancelConfirm(false);
      setLeaveToCancel(null);
      setIsDetailsModalOpen(false);
      setSelectedLeaveDetails(null);
    },
    onError: (mutationError) => {
      toast.error("Cancellation Failed", {
        description: mutationError instanceof Error ? mutationError.message : "Failed to cancel leave",
      });
    },
  });

  const processedRequests = useMemo(
    () => requests.filter((request) => request.status.toLowerCase() !== "pending"),
    [requests],
  );

  const leaveTypes = useMemo(
    () =>
      Array.from(new Set(processedRequests.map((request) => request.leave_type)))
        .sort((a, b) => a.localeCompare(b)),
    [processedRequests],
  );

  const filteredProcessedRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return processedRequests
      .filter((request) => {
        if (statusFilter === "approved") {
          return request.status.toLowerCase() === "approved";
        }

        if (statusFilter === "cancelled") {
          return ["cancelled", "rejected"].includes(request.status.toLowerCase());
        }

        return true;
      })
      .filter((request) => {
        if (leaveTypeFilter === "all") return true;
        return request.leave_type === leaveTypeFilter;
      })
      .filter((request) => {
        if (!normalizedSearch) return true;
        const fullName = `${request.firstName} ${request.lastName}`.toLowerCase();
        return fullName.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const left = new Date(a.createdAt).getTime();
        const right = new Date(b.createdAt).getTime();
        return sortOrder === "newest" ? right - left : left - right;
      });
  }, [processedRequests, searchTerm, statusFilter, leaveTypeFilter, sortOrder]);

  const pagination = usePagination(filteredProcessedRequests, 10);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const isFutureLeave = (request: LeaveRequest) =>
    new Date(request.start_date) > new Date(new Date().toDateString());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const openDetailsModal = (request: LeaveRequest) => {
    setSelectedLeaveDetails(request);
    setIsDetailsModalOpen(true);
  };

  const handleCancelLeave = (request: LeaveRequest) => {
    setLeaveToCancel(request);
    setShowCancelConfirm(true);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28">
      <MobilePageHeader className="mb-4" />
      <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_18px_48px_rgba(2,6,23,0.28)] md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/approve-leave"
              className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to approvals
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100 md:text-2xl">
              Processed Requests
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Browse processed leave activity with filters built for larger request volumes.
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="h-9 min-w-9 rounded-xl border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            disabled={isFetching}
          >
            <Loader2 className={cn("h-4 w-4", isFetching ? "animate-spin" : "hidden")} />
            {!isFetching ? "Refresh" : null}
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                pagination.resetPage();
              }}
              placeholder="Search employee name"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "all", label: "All" },
              { value: "approved", label: "Approved" },
              { value: "cancelled", label: "Cancelled" },
            ] as const).map((filterOption) => {
              const isActive = statusFilter === filterOption.value;

              return (
                <button
                  key={filterOption.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filterOption.value);
                    pagination.resetPage();
                  }}
                  className={cn(
                    "h-9 rounded-full border px-2 text-xs font-medium transition-colors sm:text-sm",
                    isActive
                      ? "border-cyan-300/30 bg-cyan-500/16 text-slate-950 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200"
                      : "border-slate-200 bg-white/85 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                  )}
                >
                  {filterOption.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={leaveTypeFilter}
              onChange={(event) => {
                setLeaveTypeFilter(event.target.value);
                pagination.resetPage();
              }}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">All leave types</option>
              {leaveTypes.map((leaveType) => (
                <option key={leaveType} value={leaveType}>
                  {leaveType}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as SortOrder);
                pagination.resetPage();
              }}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
              Processed Leave Requests
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {pagination.paginatedItems.length} of {filteredProcessedRequests.length}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-10 text-center dark:border-slate-700 dark:bg-slate-800">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-500" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading processed requests...</p>
          </div>
        ) : error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-10 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
            <p className="mb-2 font-medium text-slate-900 dark:text-slate-100">Error loading processed requests</p>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
            <Button onClick={() => refetch()} className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700">
              Try Again
            </Button>
          </div>
        ) : pagination.totalItems > 0 ? (
          <div className="space-y-3">
            {pagination.paginatedItems.map((request) => (
              <ProcessedRequestCompactCard
                key={request.id}
                request={request}
                formatDate={formatDate}
                onOpenDetails={(item) => openDetailsModal(item as LeaveRequest)}
              />
            ))}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 20, 50]}
              className="mt-2 rounded-2xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-8 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="font-medium text-slate-900 dark:text-slate-100">No processed requests found</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Try adjusting your search, status filter, or leave type.
            </p>
          </div>
        )}
      </section>

      {showCancelConfirm && leaveToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm lg:pl-72">
          <div className="w-full max-w-md rounded-3xl border border-gray-200/50 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-slate-800">
            <div className="border-b border-gray-200/50 p-6 dark:border-slate-600/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                  <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Cancel Approved Leave</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to cancel the approved leave for{" "}
                <span className="font-semibold">
                  {leaveToCancel.firstName} {leaveToCancel.lastName}
                </span>
                ?
              </p>
            </div>
            <div className="flex gap-3 border-t border-gray-200/50 p-6 dark:border-slate-600/50">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelConfirm(false);
                  setLeaveToCancel(null);
                }}
                className="flex-1"
                disabled={cancelLeaveMutation.isPending}
              >
                No, Keep It
              </Button>
              <Button
                onClick={() => leaveToCancel && cancelLeaveMutation.mutate(leaveToCancel.id)}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
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
                    Yes, Cancel
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedLeaveDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm lg:pl-72">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200/50 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-slate-800">
            <div className="border-b border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:border-slate-600/50 dark:from-slate-700 dark:to-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {selectedLeaveDetails.leave_type} Leave Request
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedLeaveDetails.firstName} {selectedLeaveDetails.lastName}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsDetailsModalOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-xl p-2 hover:bg-white/80 dark:hover:bg-slate-700/80"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </Button>
              </div>
            </div>
            <div className="max-h-[calc(90vh-200px)] space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee</label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {selectedLeaveDetails.firstName} {selectedLeaveDetails.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLeaveDetails.jobTitle}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLeaveDetails.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {formatDate(selectedLeaveDetails.start_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {formatDate(selectedLeaveDetails.end_date)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Leave Type</label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {selectedLeaveDetails.leave_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {`${selectedLeaveDetails.duration} day${selectedLeaveDetails.duration > 1 ? "s" : ""}${selectedLeaveDetails.leave_length === "half_day" ? " (Half Day)" : ""}`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedLeaveDetails.status)}>
                        {selectedLeaveDetails.status.charAt(0).toUpperCase() + selectedLeaveDetails.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Applied Date</label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {formatDate(selectedLeaveDetails.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedLeaveDetails.leave_comment && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee Comment</label>
                  <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
                    <p className="text-gray-700 dark:text-gray-300">{selectedLeaveDetails.leave_comment}</p>
                  </div>
                </div>
              )}

              {selectedLeaveDetails.feedback && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Manager Feedback</label>
                  <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-gray-700 dark:text-gray-300">{selectedLeaveDetails.feedback}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50 p-6 dark:border-slate-600/30 dark:bg-slate-700/30">
              <div className="flex gap-3">
                {selectedLeaveDetails.status === "approved" && isFutureLeave(selectedLeaveDetails) ? (
                  <Button
                    variant="outline"
                    onClick={() => handleCancelLeave(selectedLeaveDetails)}
                    className="flex-1 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel Leave
                  </Button>
                ) : null}
                <Button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className={cn(
                    "rounded-lg px-4 py-2 font-medium transition-colors duration-200",
                    selectedLeaveDetails.status === "approved" && isFutureLeave(selectedLeaveDetails)
                      ? "flex-1 bg-slate-700 text-white hover:bg-slate-800 dark:bg-slate-500 dark:hover:bg-slate-400"
                      : "w-full bg-slate-700 text-white hover:bg-slate-800 dark:bg-slate-500 dark:hover:bg-slate-400",
                  )}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessedLeaveRequestsPage;
