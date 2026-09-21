"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/marketing/site-shell";
import { Button } from "@/components/ui/button";
import { ChoiceSelect, Field, ToggleSet } from "@/components/submit/fields";
import {
  APPLYING_AS,
  COMMITMENT,
  CONTRIBUTION_KINDS,
  CUSTOMER_KINDS,
  EMPTY_DRAFT,
  EVIDENCE_KINDS,
  MARKET_GEOS,
  NEED_KINDS,
  PRICING_MODELS,
  STEP_TITLES,
  getDraftSnapshot,
  saveDraft,
  subscribeDraft,
  type ApplicationDraft,
} from "@/lib/application";
import { saveApplicationDraft, submitApplication } from "@/lib/applications/actions";
import { FOUNDER_TRACK } from "@/lib/applications/stages";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function SaveLabel({
  state,
}: {
  state: "saved" | "saving" | "error" | "local";
}) {
  const copy = {
    saved: "Saved",
    saving: "Saving...",
    error: "Unable to save — retrying",
    local: "Saved on this device",
  }[state];
  return <p className="text-sm text-mute">{copy}</p>;
}

export function SubmitWizard({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const draft = useSyncExternalStore(subscribeDraft, getDraftSnapshot, () => EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error" | "local">("local");
  const retryCount = useRef(0);
  const timer = useRef<number | null>(null);

  function patch(partial: Partial<ApplicationDraft>) {
    const next = saveDraft({ ...draft, ...partial });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void persist(next);
    }, 700);
  }

  async function persist(next: ApplicationDraft) {
    setSaveState("saving");
    const result = await saveApplicationDraft(next);
    saveDraft(result.draft);
    setSaveState(result.state);
    if (result.state === "error" && retryCount.current < 3) {
      retryCount.current += 1;
      window.setTimeout(() => {
        void persist(result.draft);
      }, 1600);
      return;
    }
    if (result.state === "saved" || result.state === "local") {
      retryCount.current = 0;
    }
  }

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (draft.submitted && draft.reference) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-2xl px-5 py-20">
          <p className="text-xs tracking-[0.18em] text-gold uppercase">Pipeline</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Your idea is in.</h1>
          <p className="mt-6 text-lg text-cream">
            Reference: <span className="font-mono tracking-[0.12em]">{draft.reference}</span>
          </p>
          <p className="mt-4 text-mute">Pesara will now perform an initial opportunity screen.</p>
          <ol className="mt-10 space-y-3">
            {FOUNDER_TRACK.map((item, index) => (
              <li key={item.key} className="flex items-center justify-between border-b border-line py-3">
                <span className="text-sm tracking-[0.12em] uppercase">{item.label}</span>
                <span className="font-mono text-gold">{index === 0 ? "✓" : "○"}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Button href={draft.applicationId ? `/dashboard/ideas/${draft.applicationId}` : "/dashboard"}>
              Track application
            </Button>
          </div>
        </section>
      </SiteShell>
    );
  }

  const step = draft.step;

  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-5 pt-14 pb-24">
        <p className="text-xs tracking-[0.18em] text-gold uppercase">
          Step {step} of 10 — {STEP_TITLES[step - 1]}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Submit your idea.</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <SaveLabel state={saveState} />
          <p className="text-xs text-mute">
            {draft.updatedAt ? `Last saved ${new Date(draft.updatedAt).toLocaleString()}` : "Not saved yet"}
          </p>
        </div>
        <div className="mt-4 h-px bg-line">
          <div className="h-px bg-gold" style={{ width: `${(step / 10) * 100}%` }} />
        </div>

        <div className="mt-10 space-y-4">
          {step === 1 ? (
            <>
              <Field label="Full name" value={draft.fullName} onChange={(fullName) => patch({ fullName })} />
              <Field label="Email" value={draft.email} onChange={(email) => patch({ email })} type="email" />
              <Field label="Phone" value={draft.phone} onChange={(phone) => patch({ phone })} type="tel" />
              <Field label="Country" value={draft.country} onChange={(country) => patch({ country })} />
              <Field label="City" value={draft.city} onChange={(city) => patch({ city })} />
              <Field label="LinkedIn (optional)" value={draft.linkedin} onChange={(linkedin) => patch({ linkedin })} />
              <Field label="Current occupation" value={draft.occupation} onChange={(occupation) => patch({ occupation })} />
              <ChoiceSelect
                label="Applicant type"
                value={draft.applyingAs}
                options={APPLYING_AS}
                onChange={(applyingAs) => patch({ applyingAs })}
              />
            </>
          ) : null}
          {step === 2 ? (
            <>
              <Field label="What problem have you discovered?" value={draft.problem} onChange={(problem) => patch({ problem })} textarea />
              <Field label="Who experiences this problem?" value={draft.whoHasIt} onChange={(whoHasIt) => patch({ whoHasIt })} textarea />
              <Field label="How serious is the problem?" value={draft.problemSeverity} onChange={(problemSeverity) => patch({ problemSeverity })} textarea />
              <Field label="How frequently does it occur?" value={draft.frequency} onChange={(frequency) => patch({ frequency })} />
              <Field label="How are people solving it today?" value={draft.currentSolution} onChange={(currentSolution) => patch({ currentSolution })} textarea />
              <Field label="Why are current solutions inadequate?" value={draft.whyInadequate} onChange={(whyInadequate) => patch({ whyInadequate })} textarea />
            </>
          ) : null}
          {step === 3 ? (
            <>
              <Field label="Idea name" value={draft.ideaName} onChange={(ideaName) => patch({ ideaName })} />
              <Field label="One-sentence explanation" value={draft.oneLiner} onChange={(oneLiner) => patch({ oneLiner })} />
              <Field label="Describe your proposed solution" value={draft.proposedSolution} onChange={(proposedSolution) => patch({ proposedSolution })} textarea />
              <Field label="What would the customer actually do with the product?" value={draft.customerDoes} onChange={(customerDoes) => patch({ customerDoes })} textarea />
              <Field label="Why would someone choose this instead of the existing alternative?" value={draft.whyChoose} onChange={(whyChoose) => patch({ whyChoose })} textarea />
            </>
          ) : null}
          {step === 4 ? (
            <>
              <Field label="Who is the customer?" value={draft.targetCustomer} onChange={(targetCustomer) => patch({ targetCustomer })} textarea />
              <ChoiceSelect
                label="Customer type"
                value={draft.customerKind}
                options={CUSTOMER_KINDS}
                onChange={(customerKind) => patch({ customerKind })}
              />
              <ChoiceSelect
                label="Where are customers located?"
                value={draft.marketGeo}
                options={MARKET_GEOS}
                onChange={(marketGeo) => patch({ marketGeo })}
              />
              <Field label="More specific location if useful" value={draft.location} onChange={(location) => patch({ location })} />
              <Field label="Known competitors" value={draft.competitors} onChange={(competitors) => patch({ competitors })} textarea />
              <Field label="Estimated number of potential customers if known" value={draft.opportunitySize} onChange={(opportunitySize) => patch({ opportunitySize })} />
              <Field label="How do you currently expect to reach customers?" value={draft.reachCustomers} onChange={(reachCustomers) => patch({ reachCustomers })} textarea />
            </>
          ) : null}
          {step === 5 ? (
            <>
              <ToggleSet
                label="What evidence do you have?"
                options={EVIDENCE_KINDS}
                value={draft.evidenceKinds}
                onChange={(evidenceKinds) => patch({ evidenceKinds })}
              />
              <Field label="Have you spoken to potential customers?" value={draft.spokenToCustomers} onChange={(spokenToCustomers) => patch({ spokenToCustomers })} />
              <Field label="Number interviewed" value={draft.interviews} onChange={(interviews) => patch({ interviews })} />
              <Field label="Existing users?" value={draft.hasUsers} onChange={(hasUsers) => patch({ hasUsers })} />
              <Field label="Number of users" value={draft.userCount} onChange={(userCount) => patch({ userCount })} />
              <Field label="Paying customers?" value={draft.paying} onChange={(paying) => patch({ paying })} />
              <Field label="Revenue if any" value={draft.revenue} onChange={(revenue) => patch({ revenue })} />
              <Field label="Waitlist size if any" value={draft.waitlistSize} onChange={(waitlistSize) => patch({ waitlistSize })} />
              <Field label="Anything else about the evidence" value={draft.evidenceNotes} onChange={(evidenceNotes) => patch({ evidenceNotes })} textarea />
            </>
          ) : null}
          {step === 6 ? (
            <>
              <Field label="Who pays?" value={draft.whoPays} onChange={(whoPays) => patch({ whoPays })} />
              <Field label="Why would they pay?" value={draft.whyPay} onChange={(whyPay) => patch({ whyPay })} textarea />
              <Field label="How will the company make money?" value={draft.howMoney} onChange={(howMoney) => patch({ howMoney })} textarea />
              <Field label="Expected pricing" value={draft.pricing} onChange={(pricing) => patch({ pricing })} />
              <ChoiceSelect
                label="Pricing model"
                value={draft.pricingModel}
                options={PRICING_MODELS}
                onChange={(pricingModel) => patch({ pricingModel })}
              />
              <Field label="What are likely major costs?" value={draft.costs} onChange={(costs) => patch({ costs })} textarea />
            </>
          ) : null}
          {step === 7 ? (
            <>
              <Field label="Why are you uniquely positioned to solve this problem?" value={draft.whyYou} onChange={(whyYou) => patch({ whyYou })} textarea />
              <Field label="Relevant experience" value={draft.experience} onChange={(experience) => patch({ experience })} textarea />
              <Field label="Industry knowledge" value={draft.industryKnowledge} onChange={(industryKnowledge) => patch({ industryKnowledge })} textarea />
              <Field label="Existing relationships" value={draft.relationships} onChange={(relationships) => patch({ relationships })} textarea />
              <Field label="Team members" value={draft.cofounders} onChange={(cofounders) => patch({ cofounders })} textarea />
              <Field label="Current skills" value={draft.skills} onChange={(skills) => patch({ skills })} textarea />
              <ChoiceSelect
                label="Time commitment"
                value={draft.commitment}
                options={COMMITMENT}
                onChange={(commitment) => patch({ commitment })}
              />
            </>
          ) : null}
          {step === 8 ? (
            <>
              <ToggleSet
                label="What already exists?"
                options={CONTRIBUTION_KINDS}
                value={draft.contributions}
                onChange={(contributions) => patch({ contributions })}
              />
              <Field label="Explain what you can bring" value={draft.contributionNotes} onChange={(contributionNotes) => patch({ contributionNotes })} textarea />
            </>
          ) : null}
          {step === 9 ? (
            <>
              <ToggleSet
                label="What do you need from Pesara?"
                options={NEED_KINDS}
                value={draft.needs}
                onChange={(needs) => patch({ needs })}
              />
              <Field
                label="What would success with Pesara look like for you?"
                value={draft.successLooksLike}
                onChange={(successLooksLike) => patch({ successLooksLike })}
                textarea
              />
            </>
          ) : null}
          {step === 10 ? (
            <div className="space-y-5">
              <div className="space-y-3 border border-line p-5 text-sm">
                <p className="text-cream">{draft.ideaName || "Untitled idea"}</p>
                <p className="text-mute">{draft.oneLiner}</p>
                <p className="text-mute">{draft.fullName} · {draft.email} · {draft.country}</p>
                <p className="text-mute">{draft.problem}</p>
                <p className="text-mute">{draft.proposedSolution}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STEP_TITLES.slice(0, 9).map((title, index) => (
                  <Button
                    key={title}
                    variant="line"
                    className="h-10 px-4"
                    onClick={() => patch({ step: index + 1 })}
                  >
                    Edit {title}
                  </Button>
                ))}
              </div>
              <div className="space-y-3 text-sm">
                {(
                  [
                    ["accurate", "The information provided is accurate."],
                    ["noPartnership", "Submitting an idea does not create a partnership."],
                    ["noObligation", "Pesara has no obligation to accept or build the idea."],
                    ["authority", "I will not submit information I lack authority to disclose."],
                    ["writtenAgreement", "Any commercial partnership requires a separate written agreement."],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex min-h-11 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(draft[key])}
                      onChange={(event) => patch({ [key]: event.target.checked })}
                      className="mt-1 h-5 w-5"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}

        <div className="mt-10 flex flex-wrap gap-3">
          {step > 1 ? (
            <Button variant="line" onClick={() => patch({ step: step - 1 })}>
              Back
            </Button>
          ) : null}
          {step < 10 ? (
            <Button onClick={() => patch({ step: step + 1 })}>Continue</Button>
          ) : (
            <Button
              onClick={() => {
                void (async () => {
                  if (!signedIn || !isSupabaseConfigured()) {
                    saveDraft(draft);
                    router.push("/register?next=/submit");
                    return;
                  }
                  setSaveState("saving");
                  const result = await submitApplication(draft);
                  saveDraft(result.draft);
                  if (result.message) {
                    setError(result.message);
                    setSaveState("error");
                    return;
                  }
                  setError(null);
                  setSaveState("saved");
                })();
              }}
            >
              Submit to Pesara
            </Button>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
