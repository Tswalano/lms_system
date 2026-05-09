interface FilterOption {
    key: string;
    label: string;
    count: number;
}

const AvailabilityFilterChips = ({
    options,
    activeFilter,
    onChange,
}: {
    options: FilterOption[];
    activeFilter: string;
    onChange: (value: string) => void;
}) => {
    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {options.map((option) => {
                const isActive = option.key === activeFilter;

                return (
                    <button
                        key={option.key}
                        type="button"
                        onClick={() => onChange(option.key)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                            isActive
                                ? "border-cyan-300/30 bg-cyan-500/16 text-slate-950 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200"
                                : "border-slate-200 bg-white/85 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                    >
                        <span>{option.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/40 text-slate-950 dark:bg-slate-800 dark:text-cyan-200" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                            {option.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default AvailabilityFilterChips;
