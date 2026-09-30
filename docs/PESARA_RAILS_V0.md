# Pesara Rails v0 — scope (first venture: Jameiyah)

Status: proposal, 30 Sep 2026. Nothing here is built yet.

## Goal

Make "we get paid when you get paid" true for one real venture. Every shilling of Jameiyah's own revenue produces a split line that the founder and Pesara can both see, and Pesara's share is collected without an invoice.

## What already exists (do not rebuild)

Jameiyah (`D:\Amanah`) already has the hard parts of a payment platform:

- Payment orchestrator with adapters: IntaSend, Daraja, Paystack, TendePay, bank scaffold, simulated; collect/disburse failover
- `payment_intents` with provider, settlement and reconcile status layers
- `webhook_events` inbox with fingerprint dedupe
- Idempotent append-only journal (`journal_entries` / `journal_lines`) keyed on `(source_type, source_id)`
- Daily reconcile cron, settlements mirror, refunds with reversing journals, maker-checker approvals
- Outbox dispatch (`claim_outbox_by_channel`)

Pesara OS already has ventures, commercial terms fields and founder/admin workspaces.

v0 is the thin layer between the two: **metering, splitting and statements**. Moving money stays with the licensed PSP.

## The one rule that matters most

**Pesara's shares apply only to the venture's own revenue. Never to money the venture holds for its customers.**

For Jameiyah, members' contributions, savings, Qard repayments and Sadaka donations are client money held in trust (amanah). Taking a percentage of them would break member trust, Jameiyah's go-live fee policy ("Global STK take-rate: None in v1") and very likely its Shariah position. Only lines where money becomes Jameiyah Limited's income are in scope.

Candidate revenue kinds in Jameiyah (confirm each accrues to Jameiyah Ltd, not to the circle):

| Kind | Where it appears | In scope? |
| --- | --- | --- |
| Circle plan purchase / renewal (Starter, Pro) | plan-renewals cron | Yes |
| `platform_tip` | phase 8 charity payments | Yes |
| `join_fee` | phase 10 | Only if it is paid to Jameiyah, not the circle |
| `contribution_fee` | phase 10 | Only if it is paid to Jameiyah, not the circle |
| Contributions, wallet top-ups, Qard, Sadaka, withdrawals | many | **No — client money** |

The Pesara site copy should say the platform fee applies to "the venture's own revenue collected", not "money collected". Change `SHARES` in `web/src/config/partnership.ts` when v0 ships.

## Money movement options

| Option | How Pesara's share is collected | Pesara holds funds? | Cost | When |
| --- | --- | --- | --- | --- |
| **A. Metered statement (v0)** | Rails computes the split per revenue event. A monthly statement is issued; Jameiyah pays it by M-Pesa B2B/bank with the statement reference. | No | Near zero | Now |
| B. PSP wallet sweep (v1) | Jameiyah revenue lands in its own IntaSend wallet; Rails instructs a daily intra-account transfer of Pesara's share to a Pesara wallet, under a standing authority in the agreement. | No (IntaSend holds) | IntaSend fees only | After 2–3 clean months of A |
| C. Split at source (v2) | Revenue collected through a Pesara-managed PSP account with sub-wallets / split rules, Pesara share settled directly. | Via PSP | Higher; licensing review | When 3+ ventures run on Rails |

Start with A. It proves the ledger and the founder statement with zero regulatory exposure, and it runs on the existing stack (least cost). B is the first real "paid at the till". C needs legal advice on CBK payment service provider rules before any design work.

## v0 components

### 1. Agreement terms (Pesara DB)

`rails_agreements`: `venture_id`, `equity_bps`, `revenue_share_bps`, `tail_bps`, `platform_fee_bps`, `build_cost_minor`, `recovery_multiple_x100`, `currency`, `effective_from`, `status` (draft, active, ended), `agreement_document`.
Cap = `build_cost_minor * recovery_multiple_x100 / 100`. One active agreement per venture. Staff-only writes via RPC; founder can read their own.

### 2. Revenue event intake

`POST /api/rails/events` on Pesara, authenticated with a per-venture HMAC secret.

Body: `{ source_event_id, kind, gross_minor, currency, occurred_at, reference }`.

`rails_revenue_events` stores it, unique on `(venture_id, source_event_id)` so retries are harmless. Refund events arrive as negative `gross_minor` with the original `source_event_id` in `reverses`.

Jameiyah side: when `complete_payment_intent` settles an in-scope kind, write an outbox row on a new `pesara_rails` channel. The existing dispatcher sends it. Refunds that reverse an in-scope kind do the same.

### 3. Split engine (pure TypeScript, fully unit tested)

Input: agreement, amount recovered so far, event. Output: split lines.

- Integer minor units only. No floats.
- Revenue share at `revenue_share_bps` until the cap is reached, then `tail_bps`.
- **An event that crosses the cap is split across both tiers** (the part below the cap at the full rate, the rest at the tail rate).
- Platform fee at `platform_fee_bps` on the whole event.
- Pesara's lines round down; the venture line is the remainder, so rounding always favours the founder and lines always sum to the gross.
- Refunds produce exactly reversing lines and reduce the amount recovered.

`rails_split_lines`: `event_id`, `line` (venture, revenue_share, platform_fee), `tier` (recovery, tail), `amount_minor`.

### 4. Statements

`rails_statements`: one per venture per month — gross, venture total, revenue share, platform fee, recovered to date, cap remaining, status (draft, issued, settled), `settlement_reference`, `settled_at`.

- Founder view: `/dashboard/ventures/[id]/rails` — every event and split line, the running recovery toward the cap, monthly statements with PDF.
- Staff view: `/admin/ventures/[id]/rails` — same, plus issue statement and mark settled (maker-checker, reusing the existing office pattern).
- Reconciliation check: statement settled amount must equal Pesara's lines for the period; mismatches go to an exception list.

### 5. Site

When v0 is live on Jameiyah, the homepage Rails card "Collections & settlement" can move from "Developing" to "Live with 1 venture", and the settlement visual can be labelled with real terms once the agreement is signed.

## Out of scope for v0

Holding or moving money, new PSP integrations, extracting Jameiyah's orchestrator into a shared package, multi-currency, equity cap tables.

## Before any code: three things only you can do

1. **Sign the Pesara–Jameiyah co-build agreement** with your Jameiyah co-founder, including the actual rates, build cost and recovery multiple. Rails v0 needs real terms.
2. **Shariah review** of the revenue share and platform fee on Jameiyah's fee income with Jameiyah's Shariah advisor.
3. **Legal check** on whether option B's standing sweep authority raises any payment-services licensing question. Option A does not move money, so it can start before this answer.

## Effort (estimate)

| Piece | Days |
| --- | --- |
| Pesara migrations + RLS + RPCs | 1.5 |
| Split engine + tests (cap crossing, refunds, rounding) | 1.5 |
| Intake endpoint + HMAC + idempotency | 1 |
| Founder and staff views + statement PDF | 2.5 |
| Jameiyah outbox emitter for in-scope kinds | 1 |
| End-to-end test with simulated provider | 1 |
| **Total** | **about 8.5 working days** |

Hosting stays on the existing Vercel and Supabase projects. No new paid services.
