"use client";

import { useState, useSyncExternalStore } from "react";
import { SiteShell } from "@/components/marketing/site-shell";
import { Button } from "@/components/ui/button";
import {
  APPLYING_AS,
  BUSINESS_TYPES,
  COMMITMENT,
  EMPTY_DRAFT,
  getDraftSnapshot,
  saveDraft,
  subscribeDraft,
  makeReference,
  type ApplicationDraft,
} from "@/lib/application";

const titles = [
  "About you",
  "The idea",
  "Market",
  "Evidence",
  "Business model",
  "Founder",
  "What you need",
  "Contribution",
  "Declarations",
  "Submit",
];

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  const className = "mt-2 w-full border border-line bg-ink-2 px-3 text-sm";
  return (
    <label className="block text-sm">
      {label}
      {textarea ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} py-3`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} h-12`}
        />
      )}
    </label>
  );
}

export function SubmitWizard() {
  const draft = useSyncExternalStore(subscribeDraft, getDraftSnapshot, () => EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  function patch(partial: Partial<ApplicationDraft>) {
    saveDraft({ ...draft, ...partial });
  }

  if (draft.submitted && draft.reference) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-2xl px-5 py-24">
          <p className="text-xs tracking-[0.18em] text-gold uppercase">Pipeline</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Your idea is officially in the Pesara pipeline.
          </h1>
          <p className="mt-6 text-mute">
            Reference <span className="text-cream">{draft.reference}</span>
          </p>
          <div className="mt-10">
            <Button href="/dashboard">Track application</Button>
          </div>
        </section>
      </SiteShell>
    );
  }

  const step = draft.step;

  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-5 pt-16 pb-24">
        <p className="text-xs tracking-[0.18em] text-gold uppercase">
          Step {step} of 10 — {titles[step - 1]}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Submit your idea.</h1>
        <p className="mt-2 text-sm text-mute">
          Last saved {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : "not yet"}
        </p>
        <div className="mt-4 h-px bg-line">
          <div className="h-px bg-gold" style={{ width: `${(step / 10) * 100}%` }} />
        </div>

        <div className="mt-10 space-y-4">
          {step === 1 ? (
            <>
              <Field label="Full name" value={draft.fullName} onChange={(fullName) => patch({ fullName })} />
              <Field label="Email" value={draft.email} onChange={(email) => patch({ email })} />
              <Field label="Phone" value={draft.phone} onChange={(phone) => patch({ phone })} />
              <Field label="Country" value={draft.country} onChange={(country) => patch({ country })} />
              <Field label="City" value={draft.city} onChange={(city) => patch({ city })} />
              <Field label="LinkedIn URL (optional)" value={draft.linkedin} onChange={(linkedin) => patch({ linkedin })} />
              <Field label="Current occupation" value={draft.occupation} onChange={(occupation) => patch({ occupation })} />
              <label className="block text-sm">
                Applying as
                <select
                  className="mt-2 h-12 w-full border border-line bg-ink-2 px-3"
                  value={draft.applyingAs}
                  onChange={(event) => patch({ applyingAs: event.target.value })}
                >
                  {APPLYING_AS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <Field label="Idea name" value={draft.ideaName} onChange={(ideaName) => patch({ ideaName })} />
              <Field label="One-line description" value={draft.oneLiner} onChange={(oneLiner) => patch({ oneLiner })} />
              <Field label="The problem" value={draft.problem} onChange={(problem) => patch({ problem })} textarea />
              <Field label="Who experiences it?" value={draft.whoHasIt} onChange={(whoHasIt) => patch({ whoHasIt })} textarea />
              <Field label="How do they solve it today?" value={draft.currentSolution} onChange={(currentSolution) => patch({ currentSolution })} textarea />
              <Field label="Why is that inadequate?" value={draft.whyInadequate} onChange={(whyInadequate) => patch({ whyInadequate })} textarea />
              <Field label="Your proposed solution" value={draft.proposedSolution} onChange={(proposedSolution) => patch({ proposedSolution })} textarea />
            </>
          ) : null}
          {step === 3 ? (
            <>
              <Field label="Target customer" value={draft.targetCustomer} onChange={(targetCustomer) => patch({ targetCustomer })} textarea />
              <Field label="Where are they?" value={draft.location} onChange={(location) => patch({ location })} />
              <label className="block text-sm">
                Model
                <select
                  className="mt-2 h-12 w-full border border-line bg-ink-2 px-3"
                  value={draft.businessType}
                  onChange={(event) => patch({ businessType: event.target.value })}
                >
                  {BUSINESS_TYPES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <Field label="How often does the problem occur?" value={draft.frequency} onChange={(frequency) => patch({ frequency })} />
              <Field label="How large is the opportunity?" value={draft.opportunitySize} onChange={(opportunitySize) => patch({ opportunitySize })} textarea />
              <Field label="Known competitors" value={draft.competitors} onChange={(competitors) => patch({ competitors })} textarea />
              <Field label="Why would customers choose this?" value={draft.whyChoose} onChange={(whyChoose) => patch({ whyChoose })} textarea />
            </>
          ) : null}
          {step === 4 ? (
            <>
              <Field label="Have you spoken to potential customers?" value={draft.spokenToCustomers} onChange={(spokenToCustomers) => patch({ spokenToCustomers })} />
              <Field label="Number interviewed" value={draft.interviews} onChange={(interviews) => patch({ interviews })} />
              <Field label="Do you currently have users?" value={draft.hasUsers} onChange={(hasUsers) => patch({ hasUsers })} />
              <Field label="Number of users" value={draft.userCount} onChange={(userCount) => patch({ userCount })} />
              <Field label="Paying customers?" value={draft.paying} onChange={(paying) => patch({ paying })} />
              <Field label="Monthly revenue if any" value={draft.revenue} onChange={(revenue) => patch({ revenue })} />
              <Field
                label="Evidence you have (prototype, website, waitlist, LOIs, pre-orders, pilots, research, none)"
                value={draft.evidence}
                onChange={(evidence) => patch({ evidence })}
                textarea
              />
            </>
          ) : null}
          {step === 5 ? (
            <>
              <Field label="Who pays?" value={draft.whoPays} onChange={(whoPays) => patch({ whoPays })} />
              <Field label="How do you expect to make money?" value={draft.howMoney} onChange={(howMoney) => patch({ howMoney })} textarea />
              <Field label="Expected pricing" value={draft.pricing} onChange={(pricing) => patch({ pricing })} />
              <Field label="Expected major costs" value={draft.costs} onChange={(costs) => patch({ costs })} textarea />
              <Field label="What would make this defensible?" value={draft.defensibility} onChange={(defensibility) => patch({ defensibility })} textarea />
            </>
          ) : null}
          {step === 6 ? (
            <>
              <Field label="Why are you the right person?" value={draft.whyYou} onChange={(whyYou) => patch({ whyYou })} textarea />
              <Field label="Relevant experience" value={draft.experience} onChange={(experience) => patch({ experience })} textarea />
              <label className="block text-sm">
                Time you can commit
                <select
                  className="mt-2 h-12 w-full border border-line bg-ink-2 px-3"
                  value={draft.commitment}
                  onChange={(event) => patch({ commitment: event.target.value })}
                >
                  {COMMITMENT.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <Field label="Co-founders?" value={draft.cofounders} onChange={(cofounders) => patch({ cofounders })} />
              <Field label="Skills the team has today" value={draft.skills} onChange={(skills) => patch({ skills })} textarea />
            </>
          ) : null}
          {step === 7 ? (
            <Field
              label="What do you need? (technology, product design, business model, validation, funding readiness, growth, partnerships, everything)"
              value={draft.needs}
              onChange={(needs) => patch({ needs })}
              textarea
            />
          ) : null}
          {step === 8 ? (
            <Field
              label="What can you contribute? (domain expertise, customers, distribution, capital, technology, licences, team, IP, other)"
              value={draft.contribution}
              onChange={(contribution) => patch({ contribution })}
              textarea
            />
          ) : null}
          {step === 9 ? (
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
                <label key={key} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(draft[key])}
                    onChange={(event) => patch({ [key]: event.target.checked })}
                    className="mt-1"
                  />
                  <span>{label}</span>
                </label>
              ))}
              <p className="text-mute">
                See <a href="/terms" className="text-cream">terms</a> and{" "}
                <a href="/privacy" className="text-cream">privacy</a>.
              </p>
            </div>
          ) : null}
          {step === 10 ? (
            <div className="space-y-3 border border-line p-5 text-sm">
              <p className="text-cream">{draft.ideaName || "Untitled idea"}</p>
              <p className="text-mute">{draft.oneLiner}</p>
              <p className="text-mute">{draft.fullName} · {draft.email} · {draft.country}</p>
              <p className="text-mute">{draft.problem}</p>
            </div>
          ) : null}
        </div>
        {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}

        <div className="mt-10 flex gap-3">
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
                if (
                  !draft.accurate ||
                  !draft.noPartnership ||
                  !draft.noObligation ||
                  !draft.authority ||
                  !draft.writtenAgreement
                ) {
                  setError("Confirm every declaration before submitting.");
                  return;
                }
                setError(null);
                patch({
                  submitted: true,
                  reference: makeReference(),
                  step: 10,
                });
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
