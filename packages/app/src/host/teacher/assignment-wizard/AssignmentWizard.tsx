"use client";

import { Checkbox, Select, TextArea, TextField, Wizard, type WizardOutcome, type WizardStep } from "@ductura/ui";
import { useRef } from "react";

import {
  AI_PURPOSES, assignmentBody, type AssignmentCreation, type AssignmentDraft, type WorkType,
} from "@/components/teacher/assignment-create";
import { publishAssignment } from "@/components/teacher/TeacherSetup/assignment-mutations";
import { assignmentSetupMessages as setup } from "@/components/teacher/TeacherSetup/messages.hr";
import type { TeacherCourse } from "@/components/teacher/teacher-courses-read";
import { formatDateTimeHr } from "@/lib/i18n/hr";
import { wordRangeHr } from "@/lib/i18n/length-line";
import { messagesHr as t } from "@/lib/i18n/messages.hr";

import { checkBasics, checkSchedule, withPractice } from "./assignment-wizard-steps";
import { ImportAllowedField } from "./ImportAllowedField";
import { wizardHr as w } from "./messages.hr";

type Course = Pick<TeacherCourse, "id" | "name" | "academicYear" | "aiPolicy">;
/** `practice` is the practice-assignment flag (WEB-1901); the server stores it and returns it, no grade field exists for it. */
type PracticeBody = NonNullable<ReturnType<typeof assignmentBody>> & { practice?: true };
type Publish = (courseId: string, body: PracticeBody, requestKey: string) => Promise<AssignmentCreation>;
type WizardDraft = AssignmentDraft & { practice?: boolean };

const a = t.teacher.assignment;
const workOptions = (["seminar_paper", "essay"] as const).map((value) => ({ value, label: a.workTypes[value] }));
const initialDraft: AssignmentDraft = {
  title: "", workType: "seminar_paper", opensAt: "", dueAt: "", instructions: "",
  wordMin: "", wordMax: "", aiPurposes: [...AI_PURPOSES],
};

/**
 * The teacher's "Novi zadatak" wizard (WEB-1403): the generic @ductura/ui Wizard with this screen's steps.
 * Finishing calls the existing create-assignment route (`publishAssignment`); `publish` is injectable for tests.
 */
export default function AssignmentWizard({ course, publish = publishAssignment }: { course: Course; publish?: Publish }) {
  const request = useRef<{ body: string; key: string } | null>(null);
  const courseProhibits = course.aiPolicy === "prohibited";

  const steps: WizardStep<WizardDraft>[] = [
    {
      id: "basics", label: w.steps.basics, validate: checkBasics,
      render: ({ values, errors, set }) => (
        <>
          <TextField label={a.title} value={values.title} required maxLength={160} autoComplete="off"
            error={errors.title} onChange={(event) => set("title", event.target.value)} />
          <Select label={a.workType} value={values.workType} options={workOptions}
            onChange={(event) => set("workType", event.target.value as WorkType)} />
          <TextArea label={setup.description} rows={4} value={values.instructions} maxLength={20_000}
            error={errors.instructions} onChange={(event) => set("instructions", event.target.value)} />
          <Checkbox label={w.practice.label} checked={values.practice === true} hint={values.practice === true ? w.practice.hint : w.practice.off}
            onChange={(event) => set("practice", event.target.checked)} />
        </>
      ),
    },
    {
      id: "schedule", label: w.steps.schedule, validate: checkSchedule,
      render: ({ values, errors, set }) => (
        <>
          <TextField label={a.opensAt} type="datetime-local" value={values.opensAt} required hint={a.timesHint}
            error={errors.opensAt} onChange={(event) => set("opensAt", event.target.value)} />
          <TextField label={a.dueAt} type="datetime-local" value={values.dueAt} required
            error={errors.dueAt} onChange={(event) => set("dueAt", event.target.value)} />
          <TextField label={a.wordMin} inputMode="numeric" value={values.wordMin} hint={a.wordRangeHint}
            onChange={(event) => set("wordMin", event.target.value)} />
          <TextField label={a.wordMax} inputMode="numeric" value={values.wordMax} error={errors.wordMax}
            onChange={(event) => set("wordMax", event.target.value)} />
        </>
      ),
    },
    {
      id: "help", label: w.steps.help, validate: () => ({}),
      render: ({ values, set }) => {
        const allowsHelp = !courseProhibits && values.aiPurposes.length > 0;
        return (
          <>
            <Select label={setup.help} value={allowsHelp ? "course" : "none"}
              options={courseProhibits ? [{ value: "none", label: setup.noHelp }] : [{ value: "course", label: setup.courseHelp }, { value: "none", label: setup.noHelp }]}
              hint={courseProhibits ? t.teacher.tools.courseProhibits : t.teacher.course.policies[course.aiPolicy]}
              onChange={(event) => set("aiPurposes", event.target.value === "course" ? [...AI_PURPOSES] : [])} />
            <ImportAllowedField value={values.importAllowed === true} onChange={(value) => set("importAllowed", value)} />
          </>
        );
      },
    },
    {
      id: "recorded", label: w.steps.recorded, validate: () => ({}),
      render: () => (
        <>
          <p>{setup.recordingNotice}</p>
          <ul>{setup.recorded.map((text) => <li key={text}>{text}</li>)}</ul>
          <p>{setup.recordingScope}</p>
        </>
      ),
    },
    {
      id: "review", label: w.steps.review, validate: () => ({}),
      render: ({ values }) => {
        const range = wordRangeHr({ min: values.wordMin.trim() ? Number(values.wordMin) : null, max: values.wordMax.trim() ? Number(values.wordMax) : null });
        const help = !courseProhibits && values.aiPurposes.length > 0 ? w.helpOn : w.helpOff;
        return (
          <section aria-labelledby="wizard-pregled">
            <h3 id="wizard-pregled">{w.reviewHeading}</h3>
            <dl>
              <dt>{w.fieldsLabel.kind}</dt><dd>{values.practice === true ? w.practiceOn : w.practiceOff}</dd>
              <dt>{w.fieldsLabel.title}</dt><dd>{values.title.trim()}</dd>
              <dt>{w.fieldsLabel.opens}</dt><dd>{formatDateTimeHr(values.opensAt)}</dd>
              <dt>{w.fieldsLabel.due}</dt><dd>{formatDateTimeHr(values.dueAt)}</dd>
              {range && <><dt>{w.fieldsLabel.words}</dt><dd>{range}</dd></>}
              <dt>{w.fieldsLabel.help}</dt><dd>{help}</dd>
            </dl>
            <p>{t.teacher.existingCourse.studentsNotified} {setup.noNotifications}</p>
          </section>
        );
      },
    },
  ];

  async function finish(draft: WizardDraft): Promise<WizardOutcome> {
    const body = assignmentBody(draft, course.aiPolicy);
    if (!body) return { ok: false, error: a.errors.invalid };
    const aiBody = withPractice(courseProhibits || body.aiPurposes.length === 0 ? body : { ...body, aiPolicy: course.aiPolicy }, draft);
    const serialized = JSON.stringify(aiBody);
    // One retry key per body, so a repeated click after an unclear reply cannot create a second assignment.
    if (request.current?.body !== serialized) request.current = { body: serialized, key: crypto.randomUUID() };
    const result = await publish(course.id, aiBody, request.current.key);
    return result.kind === "available" ? { ok: true } : { ok: false, error: a.errors[result.kind], uncertain: result.kind === "unavailable" };
  }

  return (
    <section aria-label={`${course.name} · ${course.academicYear}`}>
      <p>{course.name} · {course.academicYear}</p>
      <Wizard steps={steps} initialValues={initialDraft} labels={{ ...w.labels, finish: a.publish, finishing: a.pending }} onFinish={finish}
        done={setup.publishedNotice} />
    </section>
  );
}
