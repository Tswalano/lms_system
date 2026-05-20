interface QuickRangeOption {
    key: string;
    label: string;
    description: string;
    active: boolean;
    onClick: () => void;
}

const MobileDateStrip = ({ options }: { options: QuickRangeOption[] }) => {
    return (
        <div className="flex gap-3 overflow-x-auto pb-1">
            {options.map((option) => (
                <button
                    key={option.key}
                    type="button"
                    onClick={option.onClick}
                    className={`min-w-[112px] rounded-[1.2rem] border px-4 py-3 text-left shadow-[0_12px_32px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-colors ${
                        option.active
                            ? "border-cyan-300/30 bg-gradient-to-br from-cyan-500/20 to-emerald-500/16 text-white dark:border-cyan-800 dark:bg-cyan-950/30"
                            : "border-slate-200 bg-white/85 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                </button>
            ))}
        </div>
    );
};

export default MobileDateStrip;
