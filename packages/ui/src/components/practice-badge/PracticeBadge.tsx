import { Tag } from "../Tag";

export type PracticeBadgeProps = {
  /** The server's `practice` field of the assignment; the badge never decides it itself (WEB-1901). */
  practice: boolean | null | undefined;
  /** The visible word, from the screen's catalogue; defaults to the Croatian label. */
  label?: string;
};

export const PRACTICE_BADGE_LABEL = "Probni";

/** The "Probni" mark beside a practice assignment, for students and teachers alike. Nothing is rendered unless the server says `true`. */
export function PracticeBadge({ practice, label = PRACTICE_BADGE_LABEL }: PracticeBadgeProps) {
  if (practice !== true) return null;
  return <span data-practice-badge=""><Tag tone="accent">{label}</Tag></span>;
}
