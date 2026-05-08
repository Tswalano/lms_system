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
      className={`relative -mt-8 flex h-16 w-16 items-center justify-center rounded-full border shadow-[0_18px_48px_rgba(16,185,129,0.38)] transition-transform `}
    >
      <img
        src="favicon.png"
        alt="Disraptor"
        className="h-8 w-8 object-contain"
      />
    </button>
  );
};

export default DisraptorMenuButton;
