type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const PlusIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Sidebar panel: a window with its left column marked.
export const PanelIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M9 4v16" />
  </svg>
);

export const TrashIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export const ChevronLeftIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

// Heart: filled = favorited. fill/stroke follow currentColor.
export const HeartIcon = ({ className, filled }: P & { filled?: boolean }) => (
  <svg {...base} fill={filled ? "currentColor" : "none"} className={className}>
    <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.6 4.8 6.8 4.8c2 0 3.5 1.1 5.2 3.2 1.7-2.1 3.2-3.2 5.2-3.2 3.2 0 5.1 3.1 4 6.3-1.7 4.8-9.2 9.4-9.2 9.4Z" />
  </svg>
);

export const CheckIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const CloseIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const PencilIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4" />
  </svg>
);

export const ImageIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 16-5-5-9 9" />
  </svg>
);

export const PlayIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
  </svg>
);

export const PauseIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

export const SkipBackIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="5" y="5" width="2.5" height="14" rx="1" />
    <path d="M19 6.2v11.6a1 1 0 0 1-1.55.83L9.6 13.2a1.4 1.4 0 0 1 0-2.4l7.85-5.43A1 1 0 0 1 19 6.2Z" />
  </svg>
);

export const SkipForwardIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="16.5" y="5" width="2.5" height="14" rx="1" />
    <path d="M5 6.2v11.6a1 1 0 0 0 1.55.83l7.85-5.43a1.4 1.4 0 0 0 0-2.4L6.55 5.37A1 1 0 0 0 5 6.2Z" />
  </svg>
);

export const MusicIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </svg>
);

export const EyeIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ShuffleIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
);

export const BookIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" />
    <path d="M4 19a2 2 0 0 1 2-2h13" />
  </svg>
);
