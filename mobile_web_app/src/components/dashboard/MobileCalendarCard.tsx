import { ChevronLeft, ChevronRight } from "lucide-react";

export interface MobileCalendarEvent {
    id: string;
    title: string;
    type: "annual" | "sick" | "pending";
    date: string;
    time: string;
}

interface MobileCalendarCardProps {
    monthLabel: string;
    weekdays: string[];
    days: Array<{
        isoDate: string;
        dayNumber: number;
        isCurrentMonth: boolean;
        isToday: boolean;
        isSelected: boolean;
        events: MobileCalendarEvent[];
    }>;
    selectedDateLabel: string;
    selectedEvents: MobileCalendarEvent[];
    onPreviousMonth: () => void;
    onNextMonth: () => void;
    onSelectDate: (isoDate: string) => void;
}

const eventStyles: Record<MobileCalendarEvent["type"], string> = {
    annual: "bg-emerald-400",
    sick: "bg-amber-400",
    pending: "bg-sky-400",
};

const MobileCalendarCard = ({
    monthLabel,
    weekdays,
    days,
    selectedDateLabel,
    selectedEvents,
    onPreviousMonth,
    onNextMonth,
    onSelectDate,
}: MobileCalendarCardProps) => {
    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_18px_48px_rgba(2,6,23,0.28)]">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Team Calendar
                    </p>
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-gray-100">{monthLabel}</h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPreviousMonth}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100/90 text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-700/80 dark:text-slate-200 dark:hover:bg-slate-600"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onNextMonth}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100/90 text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-700/80 dark:text-slate-200 dark:hover:bg-slate-600"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-700/60 dark:text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Annual
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-700/60 dark:text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Sick
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-700/60 dark:text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Pending
                </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
                {weekdays.map((weekday, index) => (
                    <div key={`${weekday}-${index}`} className="pb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {weekday}
                    </div>
                ))}

                {days.map((day) => (
                    <button
                        key={day.isoDate}
                        type="button"
                        onClick={() => onSelectDate(day.isoDate)}
                        className={`flex min-h-[48px] flex-col items-center justify-start rounded-[1rem] border px-1 py-2 text-xs transition-all ${
                            day.isSelected
                                ? "border-slate-900 bg-slate-950 text-white shadow-lg dark:border-slate-500 dark:bg-slate-700 dark:text-gray-100"
                                : day.isToday
                                    ? "border-emerald-300 bg-emerald-500/15 text-slate-950 dark:border-emerald-500/50 dark:text-gray-100"
                                    : day.isCurrentMonth
                                        ? "border-slate-200 bg-slate-100/90 text-slate-900 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-200"
                                        : "border-transparent bg-transparent text-slate-400 dark:text-slate-500"
                        }`}
                    >
                        <span className="font-medium leading-none">{day.dayNumber}</span>
                        <span className="mt-1 flex min-h-2 items-center justify-center gap-1">
                            {day.events.slice(0, 3).map((event) => (
                                <span
                                    key={event.id}
                                    className={`h-1.5 w-1.5 rounded-full ${eventStyles[event.type]}`}
                                />
                            ))}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mt-4 rounded-[1.3rem] border border-slate-200/80 bg-slate-50/90 p-3.5 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-950 dark:text-gray-100">{selectedDateLabel}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedEvents.length} event{selectedEvents.length === 1 ? "" : "s"}
                    </span>
                </div>

                <div className="space-y-2">
                    {selectedEvents.length > 0 ? (
                        selectedEvents.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80"
                            >
                                <span className={`h-2.5 w-2.5 rounded-full ${eventStyles[event.type]}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-950 dark:text-gray-100">{event.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{event.time}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 dark:border-slate-700">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No events for this day</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                Your team calendar is clear here. Select another date to review scheduled leave and pending requests.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default MobileCalendarCard;
