export default function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none">
      <rect x="6" y="9" width="36" height="33" rx="7" fill="#f4f1fb" stroke="#8a8694" strokeWidth="1.2" />
      <path d="M6 16a7 7 0 0 1 7-7h22a7 7 0 0 1 7 7v3H6v-3z" fill="#ef7187" stroke="#8a8694" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="13" y="4" width="5" height="9" rx="2.5" fill="#cfe0ea" stroke="#8a8694" strokeWidth="1.2" />
      <rect x="30" y="4" width="5" height="9" rx="2.5" fill="#cfe0ea" stroke="#8a8694" strokeWidth="1.2" />
      <circle cx="9.5" cy="19.5" r="0.8" fill="#8a8694" />

      <g stroke="#8a8694" strokeWidth="1">
        <rect x="11" y="22" width="13" height="13" rx="1.5" fill="#fbd7de" />
        <path d="M14.3 22v13M17.7 22v13M21 22v13M11 25.3h13M11 28.7h13M11 32h13" />
      </g>

      <g stroke="#8a8694" strokeWidth="1.2" strokeLinejoin="round">
        <path
          d="M33 23c2.4 0 3.3 2.6 1.6 4.2 2.4 0 3.3 2.9 1 4.4-1 .6-2 .6-3-.1.3 1.3-.6 2.5-2 2.5s-2.3-1.2-2-2.5c-1 .7-2 .7-3 .1-2.3-1.5-1.4-4.4 1-4.4-1.7-1.6-.8-4.2 1.6-4.2.6 0 1.2.2 1.7.6.5-.4 1.1-.6 1.7-.6"
          fill="#ec6b85"
        />
        <circle cx="34.6" cy="29.2" r="2.1" fill="#ffe9a8" />
      </g>
    </svg>
  );
}
