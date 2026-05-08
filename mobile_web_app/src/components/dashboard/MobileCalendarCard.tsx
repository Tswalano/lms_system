import { ChevronLeft, ChevronRight } from "lucide-react";

export interface MobileCalendarEvent {
    id: string;
    title: string;
    type: "annual" | "sick" | "pending" | "team";
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
    team: "bg-fuchsia-400",
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
        <section className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.24)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                        Team Calendar
                    </p>
                    <h2 className="text-lg font-semibold text-white">{monthLabel}</h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPreviousMonth}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={onNextMonth}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] text-slate-300">Annual leave</span>
                <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] text-slate-300">Sick leave</span>
                <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] text-slate-300">Pending</span>
                <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] text-slate-300">Team event</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {weekdays.map((weekday) => (
                    <div key={weekday} className="pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                        {weekday}
                    </div>
                ))}

                {days.map((day) => (
                    <button
                        key={day.isoDate}
                        type="button"
                        onClick={() => onSelectDate(day.isoDate)}
                        className={`flex min-h-[52px] flex-col items-center justify-start rounded-2xl px-1 py-2 text-xs transition-colors ${
                            day.isSelected
                                ? "bg-white text-slate-950 shadow-lg"
                                : day.isToday
                                    ? "bg-emerald-500/20 text-white"
                                    : day.isCurrentMonth
                                        ? "bg-white/6 text-white"
                                        : "bg-transparent text-slate-500"
                        }`}
                    >
                        <span className="font-medium">{day.dayNumber}</span>
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

            <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-[#0f1b30]/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{selectedDateLabel}</h3>
                    <span className="text-xs text-slate-400">
                        {selectedEvents.length} event{selectedEvents.length === 1 ? "" : "s"}
                    </span>
                </div>

                <div className="space-y-2">
                    {selectedEvents.length > 0 ? (
                        selectedEvents.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/6 px-3 py-3"
                            >
                                <span className={`h-2.5 w-2.5 rounded-full ${eventStyles[event.type]}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">{event.title}</p>
                                    <p className="text-xs text-slate-400">{event.time}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
                            No events scheduled for this day.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default MobileCalendarCard;
