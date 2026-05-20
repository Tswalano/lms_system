import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ProcessedRequestCompactCardData {
  id: number;
  firstName: string;
  lastName: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  duration: number;
  status: string;
}

interface ProcessedRequestCompactCardProps {
  request: ProcessedRequestCompactCardData;
  formatDate: (dateString: string) => string;
  onOpenDetails: (request: ProcessedRequestCompactCardData) => void;
}

const ProcessedRequestCompactCard = ({
  request,
  formatDate,
  onOpenDetails,
}: ProcessedRequestCompactCardProps) => {
  const normalizedStatus = String(request.status ?? "").toLowerCase();
  const badgeColor =
    normalizedStatus === "approved"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      : normalizedStatus === "cancelled"
        ? "bg-slate-200 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200"
        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  const avatarGradient =
    normalizedStatus === "approved"
      ? "from-green-500 to-green-600"
      : normalizedStatus === "cancelled"
        ? "from-slate-500 to-slate-600"
        : "from-red-500 to-red-600";
  const statusLabel =
    normalizedStatus === "approved"
      ? "Approved"
      : normalizedStatus === "cancelled"
        ? "Cancelled"
        : "Rejected";

  return (
    <button
      type="button"
      onClick={() => onOpenDetails(request)}
      className="w-full rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-3 text-left shadow-[0_14px_34px_rgba(15,23,42,0.09)] backdrop-blur-xl transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/80"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarGradient} text-sm font-bold text-white`}
        >
          {request.firstName[0]}
          {request.lastName[0]}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                {request.firstName} {request.lastName}
              </h3>
              <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
                {request.leave_type}
              </p>
            </div>
            <Badge className={badgeColor}>
              {statusLabel}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Date Range
              </p>
              <p className="mt-1 truncate text-sm text-slate-900 dark:text-slate-100">
                {formatDate(request.start_date)} - {formatDate(request.end_date)}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{request.duration} day{request.duration !== 1 ? "s" : ""}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default ProcessedRequestCompactCard;
