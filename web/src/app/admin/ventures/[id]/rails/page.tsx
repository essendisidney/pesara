import type { ReactNode } from "react";
import Link from "next/link";
import { RailsEvents, RailsHeader, RailsPanel, RailsRecovery, RailsStatements } from "@/components/rails/books-view";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRange, TERMS } from "@/config/partnership";
import { formatNairobi } from "@/lib/admin/present";
import { knownMessage } from "@/lib/admin/pipeline";
import { getAuthContext } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/permissions/roles";
import {
  activateRailsAgreementAction,
  createRailsAgreementAction,
  issueRailsStatementAction,
  rotateRailsSecretAction,
  settleRailsStatementAction,
} from "@/lib/rails/actions";
import { monthLabel, monthsToIssue, nairobiMonth } from "@/lib/rails/books";
import { loadRailsBooks } from "@/lib/rails/data";
import { RAILS_ERRORS, RAILS_NOTICES } from "@/lib/rails/forms";
import { formatBps, formatMinor } from "@/lib/rails/split";

const controlClass = "mt-2 w-full min-h-12 rounded-[2px] border border-line bg-ink-2/80 px-3 text-base text-cream";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-cream">
      {label}
      {children}
      {hint ? <span className="mt-1 block text-xs text-mute">{hint}</span> : null}
    </label>
  );
}

function minorToMajorText(amountMinor: number): string {
  const negative = amountMinor < 0 ? "-" : "";
  const absolute = Math.abs(amountMinor);
  return `${negative}${Math.trunc(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export default async function StaffRailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const result = await loadRailsBooks(id, "staff");
  if (result.status === "missing") return <EmptyState title="Venture not found" />;
  if (result.status === "offline") {
    return <EmptyState title="Database is not connected">Rails books stay hidden until Pesara is connected.</EmptyState>;
  }
  if (result.status === "error") {
    return <EmptyState title="The Rails books could not be read">Try opening them again in a moment.</EmptyState>;
  }
  const books = result.value;
  const auth = await getAuthContext();
  const isAdmin = isAdminRole(auth?.role);
  const notice = knownMessage(RAILS_NOTICES, query.notice);
  const error = knownMessage(RAILS_ERRORS, query.error);
  const currentMonth = nairobiMonth(new Date());
  const pending = monthsToIssue(books.months, books.statements, currentMonth);
  const drafts = books.agreements.filter((agreement) => agreement.status === "draft");

  return (
    <>
      <Link href={`/admin/ventures/${books.ventureId}`} className="text-sm text-gold">
        {books.ventureName}
      </Link>
      <RailsHeader books={books} eyebrow="Pesara Rails · staff" />
      <p className="mt-2 text-sm text-mute">
        Founders see the same books at <span className="font-mono text-cream">/dashboard/ventures/{books.ventureId}/rails</span>, without the forms.
      </p>
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}

      <RailsRecovery books={books} />

      <RailsStatements
        books={books}
        renderActions={(statement) =>
          statement.status === "issued" ? (
            <form action={settleRailsStatementAction} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="ventureId" value={books.ventureId} />
              <input type="hidden" name="statementId" value={statement.id} />
              <Field label="Payment reference" hint="M-Pesa or bank reference of the payment received.">
                <input name="reference" required maxLength={200} className={controlClass} />
              </Field>
              <Field label={`Amount received (${statement.currency})`} hint={`Must equal ${formatMinor(statement.pesaraTotalMinor, statement.currency)}.`}>
                <input name="amount" required inputMode="decimal" placeholder={minorToMajorText(statement.pesaraTotalMinor)} className={controlClass} />
              </Field>
              <Button type="submit" variant="line">
                Mark settled
              </Button>
            </form>
          ) : null
        }
      />

      <RailsPanel
        title="Issue a statement"
        note="A statement freezes one closed month (Nairobi time). Whoever issues it cannot mark it settled; a second person checks the payment."
      >
        {books.active ? (
          <form action={issueRailsStatementAction} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <input type="hidden" name="ventureId" value={books.ventureId} />
            <Field label="Month" hint={pending.length > 0 ? `Months with events and no statement: ${pending.map(monthLabel).join(", ")}.` : "No closed month is waiting for a statement."}>
              <input name="month" type="month" required max={currentMonth.slice(0, 7)} defaultValue={pending[0]?.slice(0, 7)} className={controlClass} />
            </Field>
            <Button type="submit">Issue statement</Button>
          </form>
        ) : (
          <p className="text-sm text-mute">Activate an agreement first.</p>
        )}
      </RailsPanel>

      <RailsEvents books={books} />

      <RailsPanel title="Agreements" note="Terms come from the signed co-build agreement. One person drafts them; a second person activates them. Activating a new agreement ends the previous one.">
        {books.agreements.length === 0 ? <p className="text-sm text-mute">No agreement recorded.</p> : null}
        <ul className="divide-y divide-line border-y border-line">
          {books.agreements.map((agreement) => (
            <li key={agreement.id} className="py-4">
              <p className="text-sm text-cream">
                {agreement.status === "active" ? "Active" : agreement.status === "draft" ? "Draft" : "Ended"} · from {agreement.effectiveFrom}
              </p>
              <p className="mt-1 text-xs text-mute">
                {formatBps(agreement.revenueShareBps)} then {formatBps(agreement.tailBps)} after {agreement.recoveryMultipleX100 / 100}x of{" "}
                {formatMinor(agreement.buildCostMinor, agreement.currency)} · platform fee {formatBps(agreement.platformFeeBps)} · equity{" "}
                {formatBps(agreement.equityBps)} · kinds {agreement.revenueKinds.join(", ")} · drafted {formatNairobi(agreement.createdAt)}
              </p>
              {agreement.agreementDocument ? <p className="mt-1 text-xs text-mute">Document: {agreement.agreementDocument}</p> : null}
              {agreement.status === "draft" ? (
                <form action={activateRailsAgreementAction} className="mt-3">
                  <input type="hidden" name="ventureId" value={books.ventureId} />
                  <input type="hidden" name="agreementId" value={agreement.id} />
                  <Button type="submit" variant="line" className="h-10 px-4">
                    Activate
                  </Button>
                  {agreement.createdBy === auth?.userId ? <span className="ml-3 text-xs text-mute">You drafted this; a second person must activate it.</span> : null}
                </form>
              ) : null}
            </li>
          ))}
        </ul>

        <details className="mt-6" open={books.agreements.length === 0 && drafts.length === 0}>
          <summary className="cursor-pointer text-sm text-gold">Draft an agreement</summary>
          <form action={createRailsAgreementAction} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="ventureId" value={books.ventureId} />
            <Field label="Revenue share (%)" hint={`Published range ${formatRange(TERMS.revenueShare)}.`}>
              <input name="revenueShare" required inputMode="decimal" className={controlClass} />
            </Field>
            <Field label="After recovery (%)" hint={`Published range ${formatRange(TERMS.revenueShareTail)}.`}>
              <input name="tail" required inputMode="decimal" className={controlClass} />
            </Field>
            <Field label="Platform fee (%)" hint={`Published range ${formatRange(TERMS.platformFee)}.`}>
              <input name="platformFee" required inputMode="decimal" className={controlClass} />
            </Field>
            <Field label="Equity (%)" hint={`Published range ${formatRange(TERMS.equity)}. Recorded only; Rails does not meter equity.`}>
              <input name="equity" required inputMode="decimal" className={controlClass} />
            </Field>
            <Field label="Build cost (major units)" hint="As written in the agreement, e.g. 3000000.">
              <input name="buildCost" required inputMode="decimal" className={controlClass} />
            </Field>
            <Field label="Recovery multiple (x)" hint={`Published range ${formatRange(TERMS.recoveryMultiple, "x")}.`}>
              <input name="recoveryMultiple" required inputMode="decimal" className={controlClass} />
            </Field>
            <Field label="Currency">
              <input name="currency" defaultValue="KES" required maxLength={3} className={controlClass} />
            </Field>
            <Field label="Effective from">
              <input name="effectiveFrom" type="date" required className={controlClass} />
            </Field>
            <Field label="Metered revenue kinds" hint="The venture's own income only, e.g. plan_purchase, platform_tip. Never client money.">
              <input name="revenueKinds" required className={controlClass} />
            </Field>
            <Field label="Signed agreement (file path)">
              <input name="agreementDocument" maxLength={500} className={controlClass} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Save draft</Button>
            </div>
          </form>
        </details>
      </RailsPanel>

      {isAdmin ? (
        <RailsPanel title="Intake secret" note="The venture signs each event with this secret (HMAC-SHA256 over timestamp and body). Only admins and the intake endpoint can read it.">
          {books.intakeSecret ? (
            <>
              <p className="text-sm text-mute">Set {formatNairobi(books.intakeSecret.rotatedAt)}.</p>
              <details className="mt-2 text-xs text-mute">
                <summary className="cursor-pointer text-gold">Show secret</summary>
                <p className="mt-2 font-mono break-all text-cream/80">{books.intakeSecret.secret}</p>
              </details>
            </>
          ) : (
            <p className="text-sm text-mute">No secret set. The intake refuses every event for this venture until one is.</p>
          )}
          <form action={rotateRailsSecretAction} className="mt-4">
            <input type="hidden" name="ventureId" value={books.ventureId} />
            <Button type="submit" variant="line" className="h-10 px-4">
              {books.intakeSecret ? "Rotate secret" : "Set secret"}
            </Button>
          </form>
        </RailsPanel>
      ) : null}
    </>
  );
}
