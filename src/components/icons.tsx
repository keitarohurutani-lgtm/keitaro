type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconToday({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3v3M12 3l3 2M12 3 9 5" />
      <circle cx="12" cy="14" r="7" />
      <path d="M12 10.5V14l2.5 1.5" />
    </svg>
  );
}

export function IconTrend({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 17 9.5 11.2 13.2 14.5 20 7" />
      <path d="M14.5 7h5.5v5.5" />
    </svg>
  );
}

export function IconIdea({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.45 1.1 1.2 1.2 2.2h4.8c.1-1 .6-1.75 1.2-2.2A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

export function IconBenchmark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 20V10M12 20V4M18 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function IconAnalyze({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M9 20h6M12 16v4" />
      <path d="m9 9 2 2 4-4" />
    </svg>
  );
}

export function IconReport({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v8l5 2" />
    </svg>
  );
}

export function IconFaq({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.7" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}

export const navIcons: Record<string, (p: IconProps) => React.ReactElement> = {
  TODAY: IconToday,
  TREND: IconTrend,
  IDEA: IconIdea,
  BENCHMARK: IconBenchmark,
  ANALYZE: IconAnalyze,
  "MY REPORT": IconReport,
  MY: IconReport,
  FAQ: IconFaq,
};
