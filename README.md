# Pesara Limited

Technology venture studio headquartered in Kenya.

**You bring the idea. We bring the technology. We build the business together.**

Pesara is not a software agency, a loan app, a wallet, or a generic fintech dashboard. The public site should leave a visitor thinking: *I have an idea. I should send it to Pesara.*

## Architecture

| Layer | Role |
| --- | --- |
| `web/` | Next.js App Router product |
| `supabase/migrations/` | Postgres schema, RLS, roles |
| `CURSOR.md` | Product law for the team and for Cursor |

Server Components by default. Client Components only where the interface must be interactive (header menu, forms, wizard). Money and scoring never come from an LLM.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Lucide-ready UI, React Hook Form / Zod for later form wiring, Supabase (Postgres, Auth, Storage), Vercel.

## Local setup

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The marketing site, idea wizard and shells run without Supabase. Auth, cloud persistence, uploads and staff roles require a Pesara Supabase project.

## Environment variables

Documented in `web/.env.example`.

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never `NEXT_PUBLIC_`)
- Optional: email provider, analytics, future AI, future payments

Never commit secrets.

## Supabase

1. Create a Pesara project (do not invent a paid project in this repo).
2. Apply migrations in `supabase/migrations`.
3. `supabase/seed.sql` is empty on purpose. Production starts with no fabricated portfolio.
4. Development demos must set `ventures.is_demo = true` and must not be `public_visible`.

## Authentication and roles

Supabase Auth: email verification, password reset, no plaintext passwords.

Roles in `user_roles`, not in user-editable metadata:

`FOUNDER` · `ANALYST` · `PRODUCT` · `ENGINEER` · `INVESTMENT_COMMITTEE` · `ADMIN` · `SUPER_ADMIN`

Future: investor, partner, mentor.

Default signup is `FOUNDER`. Staff roles are granted by a super admin.

## Row Level Security

Enabled on public tables. Founders can read only their profile, applications, attached documents, founder-facing feedback, and ventures they are authorised to access.

Committee `committee_notes` are not selectable by founders. Founder-facing copy is returned through `founder_decision_view`.

Do not rely on frontend route protection alone.

## Deployment

Vercel for `web/`. Set the same environment variables. Point the domain at the production deployment. `sitemap.xml` and `robots.txt` are generated from the App Router.

## Testing

```bash
cd web
npm run test
npm run lint
npm run typecheck
npm run build
```

Critical unit tests cover application references, draft merge (autosave shape), and the ownership rule: Founder A cannot retrieve Founder B. RLS tests against a live database belong in Phase 2 once a project exists.

## Project structure

```
web/src/app/            public, founder, admin routes
web/src/components/ui/  primitives
web/src/components/marketing|dashboard|admin
web/src/lib/            domain, auth, supabase, validation, analytics, permissions
supabase/migrations/
```

## Security assumptions

- Service-role keys never ship to the client.
- File uploads will enforce MIME and size on the server.
- Audit logs have no update/delete policies for ordinary admins.
- Marketing consent is never pre-ticked.
- AI, when added, must not auto-accept ventures.

## Product phases

1. Foundation — design system, public site, auth screens, schema (this tree)
2. Idea pipeline — persist wizard to Postgres, uploads, notifications
3. Operating system — viability, committee, CRM, audit
4. Venture management
5. Intelligence — research assistance with mandatory human review

## Brand

Pesara Limited. Ideas deserve execution. Built in Africa. Built for anywhere.
