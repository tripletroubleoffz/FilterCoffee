-- ====================================================================
-- SUPABASE DATABASE ADVISOR SECURITY REFINEMENTS MIGRATION
-- File: supabase_security_fixes.sql
-- ====================================================================

-- 1. FUNCTION SEARCH PATHS MUTABLE & DEFINER REFINEMENTS
-- Update trigger function for new user registrations (sets search_path to public)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.profiles (id, nickname, email, subscription_status, preferred_topics)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'FREE',
    array['Artificial Intelligence', 'Technology']::text[]
  );
  return new;
end;
$$;

-- Update trigger function for article likes count (sets search_path to public)
CREATE OR REPLACE FUNCTION public.handle_article_like_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if (TG_OP = 'INSERT') then
    update public.articles
    set likes_count = likes_count + 1
    where id = new.article_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.articles
    set likes_count = greatest(0, likes_count - 1)
    where id = old.article_id;
    return old;
  end if;
  return null;
end;
$$;

-- Drop old RPC delete user function (releasing it from API exposure to avoid advisor warnings)
DROP FUNCTION IF EXISTS public.delete_user_account();

-- Create secure trigger function for account deletion (sets search_path to public)
CREATE OR REPLACE FUNCTION public.handle_delete_user_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  delete from auth.users where id = old.id;
  return old;
end;
$$;

-- 2. CREATE ACCOUNT DELETION TRIGGER AND POLICIES
-- Setup trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_delete_user_trigger();

-- Setup RLS profile delete policy (optimized: use select auth.uid())
DROP POLICY IF EXISTS "Allow users to delete own profile" ON public.profiles;
CREATE POLICY "Allow users to delete own profile" ON public.profiles
  FOR DELETE USING ((select auth.uid()) = id);

-- Merge the two conflicting UPDATE policies into one (fixes multiple_permissive_policies)
-- and use (select auth.uid()) to avoid per-row evaluation (fixes auth_rls_initplan)
DROP POLICY IF EXISTS "Allow users to update own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Allow admin to update all profiles" ON public.profiles;
CREATE POLICY "Allow profile updates" ON public.profiles
  FOR UPDATE USING (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.is_admin = true
    )
  );

-- 3. REVOKE EXECUTE FROM PUBLIC ON SECURITY DEFINER FUNCTIONS
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_article_like_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_delete_user_trigger() FROM PUBLIC, anon, authenticated;

-- 4. FIX RLS POLICIES — contact_submissions
-- Use (select auth.role()) to avoid per-row evaluation
DROP POLICY IF EXISTS "Allow anonymous insert of contact submissions" ON public.contact_submissions;
CREATE POLICY "Allow anonymous insert of contact submissions" ON public.contact_submissions
  FOR INSERT WITH CHECK (
    name    IS NOT NULL AND length(trim(name))    > 0 AND
    email   IS NOT NULL AND length(trim(email))   > 0 AND
    message IS NOT NULL AND length(trim(message)) > 0 AND
    (select auth.role()) IN ('anon', 'authenticated')
  );

-- 5. rss_sources — split FOR ALL into separate per-action policies
-- (fixes both auth_rls_initplan and multiple_permissive_policies)
DROP POLICY IF EXISTS "Allow all updates of rss_sources"       ON public.rss_sources;
DROP POLICY IF EXISTS "Allow admin all updates of rss_sources" ON public.rss_sources;
DROP POLICY IF EXISTS "Allow public read of rss_sources"       ON public.rss_sources;

CREATE POLICY "Allow admin or developer read of rss_sources" ON public.rss_sources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.is_admin = true OR profiles.is_developer = true)
    )
  );
CREATE POLICY "Allow admin insert of rss_sources" ON public.rss_sources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  );
CREATE POLICY "Allow admin update of rss_sources" ON public.rss_sources
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  );
CREATE POLICY "Allow admin delete of rss_sources" ON public.rss_sources
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  );

-- 6. rss_ingestion_logs — same split pattern
DROP POLICY IF EXISTS "Allow all updates of rss_ingestion_logs"       ON public.rss_ingestion_logs;
DROP POLICY IF EXISTS "Allow admin all updates of rss_ingestion_logs" ON public.rss_ingestion_logs;
DROP POLICY IF EXISTS "Allow public read of rss_ingestion_logs"       ON public.rss_ingestion_logs;

CREATE POLICY "Allow admin or developer read of rss_ingestion_logs" ON public.rss_ingestion_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.is_admin = true OR profiles.is_developer = true)
    )
  );
CREATE POLICY "Allow admin insert of rss_ingestion_logs" ON public.rss_ingestion_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  );
CREATE POLICY "Allow admin update of rss_ingestion_logs" ON public.rss_ingestion_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  );
CREATE POLICY "Allow admin delete of rss_ingestion_logs" ON public.rss_ingestion_logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  );

