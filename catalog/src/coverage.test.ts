import { readdirSync } from "node:fs";
import { basename } from "node:path";

import * as ui from "@ductura/ui";
import { AssistantThread } from "@ductura/ui/assistant-thread";
import { describe, expect, it } from "vitest";

import { CATALOG_STATES, catalogGaps, componentNames } from "./coverage";
import * as screens from "../../src/components/index.ts";
import { ENTRIES, SCREEN_ENTRIES } from "./entries";

// Components present in the migration base before catalogue integration.
// New component files still need a public export and catalogue entry.
const PENDING_SCREEN_ENTRIES = new Set([
  "admin/FacultyRules.tsx",
  "admin/InstitutionCourses.tsx",
  "admin/InstitutionOverview.tsx",
  "admin/TeacherRoles.tsx",
  "auth/AccessCard.tsx",
  "auth/SignInScreen.tsx",
  "editor/CommentPanel.tsx",
  "editor/EarlierDraft.tsx",
  "editor/EditorPage.tsx",
  "editor/EditorPageWork.tsx",
  "editor/EditorToolbar.tsx",
  "editor/EditorToolbarFor.tsx",
  "editor/HeadingOutline.tsx",
  "editor/LocalDocument.tsx",
  "editor/LogoutDialog.tsx",
  "editor/OfflineNotice.tsx",
  "editor/OpenWork.tsx",
  "editor/RevisionPanel.tsx",
  "editor/SidePanels.tsx",
  "editor/SourcesPanel.tsx",
  "editor/StatusBar.tsx",
  "editor/StatusBarLive.tsx",
  "editor/StatusLength.tsx",
  "editor/ToolbarMenu.tsx",
  "editor/WorkspaceTopBar.tsx",
  "editor/citations/CitationPopover.tsx",
  "editor/addons/MarkerPalette.tsx",
  "editor/addons/SpeechControls.tsx",
  "editor/import/ImportTextDialog.tsx",
  "editor/citations/ReviewPlaces.tsx",
  "editor/commands/EditorCommands.tsx",
  "editor/crossref/CrossReferenceDialog.tsx",
  "editor/footnotes/FootnoteDialog.tsx",
  "editor/footnotes/useV3EditorDialogs.tsx",
  "editor/help/EditorHelp.tsx",
  "editor/help/EditorHelpMenu.tsx",
  "editor/help/EditorNotices.tsx",
  "editor/layout-prefs/EditorPanelLayout.fixture.tsx",
  "editor/pages/CoverDialog.tsx",
  "editor/pages/CoverPage.tsx",
  "editor/pages/PageFormatDialog.tsx",
  "editor/layout-prefs/EditorPanelLayout.tsx",
  "editor/layout-prefs/LeftPanel.tsx",
  "editor/layout-prefs/PanelSettings.tsx",
  "editor/layout-prefs/RightPanel.tsx",
  "editor/layout/EditorShell.tsx",
  "editor/parts/CitationSettingsDialog.tsx",
  "editor/parts/EditorCitationSettings.tsx",
  "editor/parts/EditorWorkParts.tsx",
  "editor/parts/WorkPartsDialog.tsx",
  "editor/history/WorkHistory.tsx", // WEB-9E: awaits work.versions.get in the contract and the toolbar integration.
  "editor/print-export/PrintExportDialog.tsx", // WEB-10E: awaits the export client and toolbar integration.
  "editor/print-export/docx-download/DocxDownload.tsx", // WEB-1303: part of PrintExportDialog; catalogued with it.
  "editor/print-export/docx-download/WorkPrintExport.tsx", // WEB-1303: toolbar opener of PrintExportDialog; catalogued with it.
  "editor/submission-package/SubmissionPackage.tsx", // WEB-9E: awaits the toolbar integration.
  "editor/sources/panel/SourceList.tsx",
  "editor/sources/quick-source/QuickSource.tsx",
  "editor/rich/table-image/CropDialog.tsx", // WEB-10A: awaits the Tiptap node views of table and image.
  "editor/rich/table-image/ImageBar.tsx", // WEB-10A
  "editor/rich/table-image/TableBar.tsx", // WEB-10A
  "editor/triggers/TriggerPopover.tsx",
  "editor/triggers/browser/fixture.tsx",
  "how-it-works/HowItWorks.tsx",
  "replay/ReplayView.tsx",
  "shell/AppHeader.tsx",
  "shell/NoRoleCard.tsx",
  "shell/RoleShell.tsx",
  "shell/SessionObserver.tsx",
  "shell/SheetFrame.tsx",
  "shell/ShellLogout.tsx",
  "shell/ShellRail.tsx",
  "shell/ShellSignOut.tsx",
  "shell/ThemeRestore.tsx",
  "shell/WorkspaceShell.tsx",
  "status/StatusBoard.tsx",
  "student/AccessLogView.tsx",
  "student/AssignmentNotice.tsx",
  "student/EnrollForm.tsx",
  "student/NoticeCourse.tsx",
  "student/StudentWorkspace.tsx",
  "student/Submission.tsx",
  "student/TeacherViewSheet.tsx",
  "student/WorkDocumentProvider.tsx",
  "student/radovi/MyWorks.tsx",
  "student/receipt/ReceiptRecord.tsx", // WEB-9E: awaits mounting under ReceiptPanel (predaja, another lane).
  "student/upis/EnrollForm.tsx",
  "summary/ProcessSummaryView.tsx",
  "support/ProblemReport.tsx",
  "teacher/AssignmentVersionForm.tsx",
  "teacher/FastPath.tsx",
  "teacher/LiveText.tsx",
  "teacher/LiveWorkView.tsx",
  "teacher/RecordLimits.tsx",
  "teacher/SummaryCard.tsx",
  "teacher/TeacherComments.tsx",
  "teacher/TeacherSetup.tsx",
  "teacher/WorkLanguageCard.tsx",
  "teacher/WorkLanguageExceptionCard.tsx",
  "teacher/kolegiji/CourseCodes.tsx",
  "teacher/shell/TeacherShell.tsx",
  "teacher/shell/TeacherShellFrame.tsx",
  "editor/diff/ComparisonResult.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/diff/SubmissionComparisonDialogs.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/diff/VersionComparison.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/revision/RevisionLog.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/revision/SendRevisionDialog.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/spelling/SpellingPopover.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/suggestions/SuggestionCard.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "teacher/compare/TeacherVersionComparison.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "teacher/consultation-records/ConsultationDetail.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "teacher/consultation-records/ConsultationRecords.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "teacher/consultation-records/NewConsultation.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "teacher/deadline-extensions/DeadlineExtensions.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "teacher/merlin-export/MerlinExport.tsx", // WEB-1114: page of N-18; catalogue entry follows with the host mount.
  "teacher/revision/ReturnForRevisionDialog.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/assistant/coming-soon/AssistantComingSoonCard.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/mentor/consultation-slots/ConsultationSlots.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/mentor/messages/WorkMessages.tsx", // WEB-1110: exercised in the Mentor card.
  "editor/mentor/milestones/WorkMentorSections.tsx", // WEB-1110: exercised in the Mentor card.
  "editor/mentor/milestones/WorkMilestones.tsx", // WEB-1110: exercised in the Mentor card.
  "editor/mentor/timeline/WorkTimeline.tsx", // WEB-1111: dialog owned by the mounted Mentor panel.
  "editor/mentor/work-state/MentorWorkState.tsx", // WEB-1111: subview of the editor and teacher work frames.
  "editor/mentor/work-state/ReadOnlyMentor.tsx", // WEB-1111: authenticated entry on read-only work surfaces.
  "teacher/mentored-students/MentoredStudents.tsx", // WEB-1111: role-gated dialog owned by Mentor.
  "editor/mentor/working-criteria/WorkingCriteria.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/rich/blocks/FormulaDialog.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/rich/blocks/RichBlockTools.tsx", // ZEL-W13: landed without a catalogue entry; awaits its lane.
  "editor/text-fixes/TextFixesPanel.tsx", // WEB-1103: not mounted yet; awaits the Pregled card mount.
  "editor/review/ReviewPanel.tsx", // WEB-1102: Pregled card, not mounted in the right panel yet; awaits its entry with the mount.
  "editor/submission-rehearsal/SubmissionRehearsal.tsx", // WEB-1105: landed without a catalogue entry; awaits its lane.
  "editor/find-replace/FindReplaceBar.tsx", // WEB-1605: needs a live editor; its FindBar is catalogued in @ductura/ui.
]);

describe("every component has a catalogue entry with all five states (web.md §6 B5)", () => {
  it("the catalogue covers every component @ductura/ui exports", () => {
    expect(catalogGaps({ ...ui, AssistantThread }, ENTRIES)).toEqual([]);
  });

  it("the catalogue covers every component src/components exports (DAN-753)", () => {
    expect(catalogGaps(screens, SCREEN_ENTRIES)).toEqual([]);
  });

  it("src/components exports component files outside the migration backlog (DAN-753)", () => {
    const root = new URL("../../src/components/", import.meta.url);
    const exports = componentNames(screens);
    const coveredFiles = readdirSync(root, { recursive: true, encoding: "utf8" })
      .map((file) => file.replaceAll("\\", "/"))
      .filter((file) => file.endsWith(".tsx") && !/\.(?:test|spec)\.tsx$/.test(file) && !file.startsWith("node_modules/"))
      .filter((file) => !PENDING_SCREEN_ENTRIES.has(file) || exports.includes(basename(file, ".tsx")))
      .map((file) => basename(file, ".tsx"))
      .sort();
    expect(coveredFiles).toEqual(exports);
  });

  it("the five states are the plan's, in its order", () => {
    expect(CATALOG_STATES).toEqual(["prazno", "učitavanje", "greška", "puno", "onemogućeno"]);
  });

  const all = Object.fromEntries(CATALOG_STATES.map((s) => [s, () => null]));

  it("fails for a new component without an entry", () => {
    const exports = { ...ui, ExampleComponent: () => null };
    expect(catalogGaps(exports, ENTRIES)).toEqual(["ExampleComponent: nema unosa u katalogu"]);
  });

  it("fails for an entry missing a state, and for an extra state", () => {
    const { greška: _drop, ...four } = all;
    expect(catalogGaps({ Button: ui.Button }, { Button: four })).toEqual(["Button: nedostaje stanje greška"]);
    expect(catalogGaps({ Button: ui.Button }, { Button: { ...all, hover: () => null } }))
      .toEqual(["Button: nepoznato stanje hover"]);
  });

  it("fails for an entry of a component that does not exist", () => {
    expect(catalogGaps({}, { Ghost: all })).toEqual(["Ghost: unos bez komponente"]);
  });

  it("counts only capitalised functions as components", () => {
    expect(componentNames({ Button: () => null, saveStateContent: () => null, SAVE_STATES: {}, THEME_KEY: "x" }))
      .toEqual(["Button"]);
  });
});
