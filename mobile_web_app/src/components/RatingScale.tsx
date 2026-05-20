import { cn } from "@/lib/utils";
import { RATING_LABELS, RATING_TONES, RATING_TEXT_TONES, type RatingValue } from "@/lib/performanceReview";

interface RatingScaleProps {
    value: RatingValue;
    onChange: (v: RatingValue) => void;
    showLabel?: boolean;
    disabled?: boolean;
    size?: "sm" | "md";
}

const RatingScale = ({ value, onChange, showLabel = true, disabled, size = "md" }: RatingScaleProps) => {
    const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
    return (
        <div className="flex flex-col items-start gap-1.5">
            <div className="flex gap-1.5">
                {([1, 2, 3, 4, 5] as const).map((n) => {
                    const active = value === n;
                    return (
                        <button
                            key={n}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(active ? null : n)}
                            className={cn(
                                "rounded-lg border font-semibold transition-all",
                                dim,
                                active
                                    ? RATING_TONES[n] + " shadow-md scale-105"
                                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700",
                                disabled && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            {n}
                        </button>
                    );
                })}
            </div>
            {showLabel && value && (
                <span className={cn("text-xs font-medium", RATING_TEXT_TONES[value])}>
                    {RATING_LABELS[value]}
                </span>
            )}
        </div>
    );
};

export default RatingScale;
