"use client";

/**
 * Accessible progress bar.
 *
 * Why not react-bootstrap's <ProgressBar>: it renders `role="progressbar"` on
 * the inner div while spreading `aria-label` onto the outer wrapper (which has
 * no role → `aria-prohibited-attr`), and ARIA forbids name-from-content for
 * the progressbar role, so `label` + `visuallyHidden` doesn't name it either
 * (Lighthouse `aria-progressbar-name` failed on both shapes). This component
 * puts role + name + values on ONE element, matching what axe/ARIA require.
 */

export interface NamedProgressProps {
  /** Fill percentage 0-100 (clamped). */
  value: number;
  /** Accessible name — REQUIRED, this is the whole point of the component. */
  label: string;
  /** Bootstrap background variant for the fill. */
  variant?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function NamedProgress({
  value,
  label,
  variant = "warning",
  className,
  style,
}: NamedProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`progress ${className ?? ""}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      style={style}
    >
      <div className={`progress-bar bg-${variant}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
