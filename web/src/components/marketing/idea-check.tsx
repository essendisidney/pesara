"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getDraftSnapshot, saveDraft } from "@/lib/application";
import { diagnoseIdea, shareQuery, type IdeaAnswers, type IdeaDiagnostic } from "@/lib/idea-check";
import { ideaCheckPrefill } from "@/lib/idea-check-draft";
import { Button } from "@/components/ui/button";

const fields: { key: keyof IdeaAnswers; label: string }[] = [
  { key: "problem", label: "What problem are you solving?" },
  { key: "who", label: "Who has the problem?" },
  { key: "today", label: "How are they solving it today?" },
  { key: "inadequate", label: "Why is the current solution inadequate?" },
  { key: "payer", label: "Who would pay for your solution?" },
  { key: "moneyFlow", label: "How would money move through it? Who pays whom, how often, and roughly how much?" },
  { key: "evidence", label: "What evidence do you currently have?" },
  { key: "position", label: "Why are you positioned to solve it?" },
];

const empty: IdeaAnswers = {
  problem: "",
  who: "",
  today: "",
  inadequate: "",
  payer: "",
  moneyFlow: "",
  evidence: "",
  position: "",
};

export function IdeaCheck() {
  const router = useRouter();
  const [answers, setAnswers] = useState<IdeaAnswers>(empty);
  const [result, setResult] = useState<IdeaDiagnostic | null>(null);
  const [copied, setCopied] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setCopied(false);
    setResult(diagnoseIdea(answers));
  }

  function continueToPesara() {
    if (!result) return;
    saveDraft(ideaCheckPrefill(getDraftSnapshot(), answers));
    router.push("/submit");
  }

  async function copyShare() {
    if (!result) return;
    const url = `${window.location.origin}/idea-check/share?${shareQuery(result.categories)}`;
    if (!navigator.clipboard) {
      setCopied(false);
      return;
    }
    const wrote = await navigator.clipboard.writeText(url).then(
      () => true,
      () => false,
    );
    setCopied(wrote);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24">
      <form onSubmit={onSubmit} className="grid gap-6">
        {fields.map((field) => (
          <label key={field.key} className="block text-sm text-cream">
            {field.label}
            <textarea
              required
              maxLength={2000}
              rows={4}
              value={answers[field.key] ?? ""}
              onChange={(event) => setAnswers((current) => ({ ...current, [field.key]: event.target.value }))}
              className="mt-2 w-full min-h-28 rounded-[2px] border border-line bg-ink-2/80 px-3 py-3 text-base text-cream"
            />
          </label>
        ))}
        <Button type="submit">Read this idea</Button>
      </form>
      {result ? (
        <section className="mt-12 border border-line px-5 py-6">
          <p className="text-xs tracking-[0.18em] text-gold uppercase">Pesara Idea Check</p>
          <p className="mt-4 text-sm text-mute">{result.disclaimer}</p>
          <ul className="mt-6 space-y-5">
            {result.categories.map((category) => (
              <li key={category.key}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm text-cream">{category.label}</p>
                  <p className="font-mono text-[11px] tracking-[0.14em] text-mute uppercase">{category.caption}</p>
                </div>
                <div className="mt-2 flex gap-1" aria-hidden>
                  {Array.from({ length: 9 }, (_, index) => (
                    <span key={index} className={`h-2 flex-1 ${index < category.level * 3 ? "bg-gold" : "bg-white/10"}`} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 text-lg font-medium">Biggest unanswered questions</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-mute">
            {result.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
          <h2 className="mt-8 text-lg font-medium">Ready to investigate this properly?</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={continueToPesara}>
              Submit to Pesara
            </Button>
            <Button type="button" variant="line" onClick={copyShare}>
              {copied ? "Link copied" : "Copy share card"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-mute">The share card shows the bars only. It does not include what you wrote.</p>
        </section>
      ) : null}
    </div>
  );
}
