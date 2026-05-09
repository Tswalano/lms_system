interface DisraptorMenuButtonProps {
  active?: boolean;
  onClick: () => void;
}

const DisraptorMenuButton = ({
  active = false,
  onClick,
}: DisraptorMenuButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      aria-pressed={active}
      className={`relative -mt-8 flex h-16 w-16 items-center justify-center overflow-visible rounded-full transition-transform duration-300 ${
        active ? "scale-[1.02]" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-16px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.26)_0%,rgba(59,130,246,0.14)_38%,rgba(14,165,233,0.06)_58%,transparent_76%)] blur-2xl animate-[pulse_6.8s_ease-in-out_infinite] dark:bg-[radial-gradient(circle,rgba(34,211,238,0.3)_0%,rgba(59,130,246,0.18)_36%,rgba(14,165,233,0.08)_56%,transparent_76%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-8px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.42)_0%,rgba(125,211,252,0.18)_34%,transparent_68%)] blur-xl opacity-80 animate-[pulse_5.6s_ease-in-out_infinite] dark:bg-[radial-gradient(circle,rgba(56,189,248,0.24)_0%,rgba(14,165,233,0.14)_36%,transparent_70%)]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.38)_45%,rgba(191,219,254,0.3)_100%)] shadow-[0_12px_30px_rgba(14,165,233,0.18),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl dark:border-cyan-300/14 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.9)_0%,rgba(15,23,42,0.82)_52%,rgba(8,47,73,0.82)_100%)] dark:shadow-[0_16px_38px_rgba(8,145,178,0.28),inset_0_1px_0_rgba(186,230,253,0.1)]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-[5px] rounded-full border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(239,246,255,0.16)_100%)] dark:border-cyan-200/10 dark:bg-[linear-gradient(180deg,rgba(51,65,85,0.58)_0%,rgba(15,23,42,0.16)_100%)]"
      />
      <img
        src="favicon.png"
        alt="Disraptor"
        className="relative z-10 h-8 w-8 object-contain"
      />
    </button>
  );
};

export default DisraptorMenuButton;
