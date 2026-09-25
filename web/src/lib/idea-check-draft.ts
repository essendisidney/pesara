import { emptyDraft, type ApplicationDraft } from "@/lib/application";
import type { IdeaAnswers } from "@/lib/idea-check";

export function ideaCheckPrefill(current: ApplicationDraft, answers: IdeaAnswers): ApplicationDraft {
  const base = current.submitted ? emptyDraft() : current;
  const problem = answers.problem.trim();
  const who = answers.who.trim();
  const today = answers.today.trim();
  const inadequate = answers.inadequate.trim();
  const payer = answers.payer.trim();
  const evidence = answers.evidence.trim();
  const position = answers.position.trim();
  return {
    ...base,
    problem: problem || base.problem,
    whoHasIt: who || base.whoHasIt,
    targetCustomer: who || base.targetCustomer,
    currentSolution: today || base.currentSolution,
    whyInadequate: inadequate || base.whyInadequate,
    whoPays: payer || base.whoPays,
    evidenceNotes: evidence || base.evidenceNotes,
    whyYou: position || base.whyYou,
    submitted: false,
    stage: "draft",
  };
}

export function freshPrefill(answers: IdeaAnswers): ApplicationDraft {
  return ideaCheckPrefill(emptyDraft(), answers);
}
