# Supabase Setup

Phase 2 uses Supabase Auth and Postgres only.

1. Create a Supabase project.
2. Apply `supabase/migrations/20260708000000_phase_2_accounts.sql` in the Supabase SQL editor or with the Supabase CLI.
   The `20260709000000_project_document_types.sql` migration is a deploy prerequisite and must be applied before document writes.
3. Add these env vars to Vercel preview and production when ready:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_TEMPLATE_KIT_LINK`
   - `NEXT_PUBLIC_SHOW_UPSELLS` (set to `true` only when an upsell link is ready)
4. Confirm the `profiles` and `change_orders` tables are exposed through the Data API for authenticated clients if your project uses the newer explicit API exposure setting.

RLS is enabled on both tables and every policy is scoped to `(select auth.uid())`.
