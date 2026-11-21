import type { WizardErrors } from "@ductura/ui";

import { parseWordRange, type AssignmentDraft } from "@/components/teacher/assignment-create";
import { zagrebInstant } from "@/lib/i18n/zagreb";

import { wizardHr } from "./messages.hr";

const e = wizardHr.errors;

/** Step 1: the title is required and at most 160 characters; the description is capped like the server. */
export function checkBasics(draft: AssignmentDraft): WizardErrors {
  const errors: Record<string, string> = {};
  const title = draft.title.trim();
  if (!title || Array.from(title).length > 160) errors.title = e.title;
  if (Array.from(draft.instructions).length > 20_000) errors.instructions = e.instructions;
  return errors;
}

/** Step 2: both times, the deadline after the start, and a valid optional word range. */
export function checkSchedule(draft: AssignmentDraft): WizardErrors {
  const errors: Record<string, string> = {};
  const opensAt = zagrebInstant(draft.opensAt);
  const dueAt = zagrebInstant(draft.dueAt);
  if (!opensAt) errors.opensAt = e.opensAt;
  if (!dueAt) errors.dueAt = e.dueAt;
  else if (opensAt && dueAt <= opensAt) errors.dueAt = e.dueBeforeOpen;
  if (!parseWordRange(draft.wordMin, draft.wordMax)) errors.wordMax = e.words;
  return errors;
}

/**
 * The create body with the practice flag (WEB-1901): sent only when ticked, as a boolean, never a grade or score field.
 * Until the server contract lists `practice`, a ticked box is rejected by the typed client; an unticked one changes nothing.
 */
export function withPractice<T extends object>(body: T, draft: { practice?: boolean }): T & { practice?: true } {
  return draft.practice === true ? { ...body, practice: true } : body;
}
