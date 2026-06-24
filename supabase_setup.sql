-- ==========================================
-- FILTERCOFFEE AI — SUPABASE DATABASE SCHEMA & SEED DATA
-- Run this in the Supabase SQL Editor (New Query)
-- ==========================================

-- Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nickname text,
  dob date,
  gender text,
  email text,
  phone text,
  country text,
  avatar_url text,
  subscription_status text default 'FREE' check (subscription_status in ('FREE', 'PRO')),
  preferred_topics text[] default array['Artificial Intelligence', 'Technology']::text[],
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row-Level Security (RLS)
alter table public.profiles enable row level security;

-- 2. ARTICLES TABLE
create table if not exists public.articles (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  headline text not null,
  summary text not null,
  content text not null,
  image_url text,
  audio_url text,
  duration text,
  transcript text,
  likes_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.articles enable row level security;

-- 3. SAVED ARTICLES (Bookmarks)
create table if not exists public.saved_articles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  article_id uuid references public.articles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, article_id)
);

-- Enable RLS
alter table public.saved_articles enable row level security;

-- 4. LIKED ARTICLES
create table if not exists public.liked_articles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  article_id uuid references public.articles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, article_id)
);

-- Enable RLS
alter table public.liked_articles enable row level security;

-- 5. FAQS TABLE
create table if not exists public.faqs (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  answer text not null
);

-- Enable RLS
alter table public.faqs enable row level security;

-- 6. CONTACT SUBMISSIONS
create table if not exists public.contact_submissions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.contact_submissions enable row level security;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Profiles RLS
create policy "Allow public read of profiles" on public.profiles
  for select using (true);

create policy "Allow users to update own profile" on public.profiles
  for update using ((select auth.uid()) = id);

-- Articles RLS
create policy "Allow public read of articles" on public.articles
  for select using (true);

-- Saved Articles RLS
create policy "Allow users to view own saves" on public.saved_articles
  for select using ((select auth.uid()) = user_id);

create policy "Allow users to insert own saves" on public.saved_articles
  for insert with check ((select auth.uid()) = user_id);

create policy "Allow users to delete own saves" on public.saved_articles
  for delete using ((select auth.uid()) = user_id);

-- Liked Articles RLS
create policy "Allow users to view own likes" on public.liked_articles
  for select using (true);

create policy "Allow users to insert own likes" on public.liked_articles
  for insert with check ((select auth.uid()) = user_id);

create policy "Allow users to delete own likes" on public.liked_articles
  for delete using ((select auth.uid()) = user_id);

-- FAQs RLS
create policy "Allow public read of FAQs" on public.faqs
  for select using (true);

-- Contact Submissions RLS
create policy "Allow anonymous insert of contact submissions" on public.contact_submissions
  for insert with check (true);


-- ==========================================
-- PROFILE TRIGGER ON AUTH.USERS CREATION
-- ==========================================

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
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
$$ language plpgsql security definer;

-- Trigger to execute function on sign up
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- SEED MOCK DATA
-- ==========================================

-- Seed FAQs
insert into public.faqs (question, answer) values
('What is FilterCoffee AI?', 'FilterCoffee AI is an intelligence portal that transforms information overload into clean, actionable digests. We take thousands of raw articles (Coffee Beans) and filter them down to a tailored brew of insights that truly matter to you.'),
('How does the voice news (Brewing Wave) work?', 'Brewing Wave converts the daily top AI news digests into professional audio formats. You can listen to customized voice summaries directly in the app at 1x, 1.5x, or 2x speed, alongside synced scrolling transcripts.'),
('What is the difference between Free and Pro plans?', 'The Free plan offers 3 active preferences topics, a weekly email summary, and saved articles. The Pro plan (₹599/mo) upgrades you to 10 active topics, daily email summaries, voice-based Brewing Wave, saved brew history, and priority AI updates.'),
('Can I change my preferred topics later?', 'Yes! You can edit your preferred topics at any time via your Onboarding wizard or the Profile settings screen. Changes will reflect instantly on your homepage feed.'),
('How do I contact support?', 'You can reach out to our team via the Contact Us form below or email us at support@filtercoffee.ai. We typically respond within 24 hours.')
on conflict do nothing;

-- Seed Mock News Articles
insert into public.articles (category, headline, summary, content, likes_count, audio_url, duration, transcript) values
(
  'Model Wars',
  'Titan AI Unveils Omni-7: The First Monochromatic Intelligence Engine',
  'Titan AI released Omni-7 today, setting new benchmarks in latency and logical reasoning. The model processes visual, voice, and text inputs natively.',
  'Omni-7 stands out as the latest multi-modal benchmark leader, showing a 30% reduction in response latency compared to current market leaders. It achieves high scores in advanced coding and math benchmarks, signaling a major leap in developer productivity. The model is available today for enterprise previews.',
  142,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  '2:15',
  'Today, Titan AI unveiled its latest model, Omni-7. Built from the ground up as a native multimodal intelligence engine, Omni-7 supports voice, text, and visual inputs. Early benchmarks show outstanding reasoning speed and low latency, outperforming standard models. We expect this will revolutionize developer tooling and automated workflows.'
),
(
  'Freshly Brewed',
  'SaaS Valuations Regain Ground Amid Monochromatic Interface Trends',
  'Leading software platforms are moving away from bright accent colors to minimal grayscale themes, resulting in improved user retention.',
  'Design system architects are reporting a 15% increase in session durations when software platforms utilize clean monochromatic designs. By reducing visual fatigue from heavy accent colors and neon indicators, developers are creating high-end SaaS applications that feel premium, minimal, and Apple-like.',
  89,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  '1:45',
  'SaaS designs are undergoing a dramatic transformation. Industry statistics indicate that monochromatic interfaces (pure black, white, and gray) reduce user eye strain and improve concentration. Clean typography and stark layouts are replacing multi-colored templates, creating a professional enterprise environment.'
),
(
  'Startup Funding',
  'BrewTech Raises ₹450M to Automate Quality Checks Using Edge ML',
  'The Bengaluru-based startup specializes in integrating vision models directly into coffee roasting machines for perfect filtering.',
  'BrewTech has secured ₹450M in Series A funding led by Capital V. The startup plans to scale its edge computing quality controllers, which deploy low-power convolutional neural networks onto agricultural machinery. This ensures bean classification is carried out in real-time right at the harvest site.',
  210,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  '3:10',
  'In funding news, BrewTech has closed a Series A round of ₹450 million. The company aims to deploy smart micro-controllers running specialized Edge ML algorithms directly into agriculture equipment. Their first target is automated coffee bean filtering, optimizing quality checks before roasting.'
),
(
  'AI Marketplace',
  'Open-Source Agents Replace Traditional Customer Success Pipelines',
  'New open-source framework allows developers to build self-learning customer support workflows with full SQL-database integrations.',
  'Autonomous agents are executing customer requests by interacting with transactional databases directly. Safety guardrails are built using prompt isolation, ensuring agents cannot perform unauthorized actions. Early adopters report an 80% decrease in response times for routine account tasks.',
  74,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  '2:30',
  'Autonomous customer agents are seeing massive adoption. The latest open-source frameworks allow builders to hook up logic agents straight to their databases. Safety is managed through isolated verification layers, keeping data secure while resolving inquiries within seconds.'
),
(
  'Career Radar',
  'Prompt Engineering Demands Shift Toward Core Logic and DB Knowledge',
  'Job listings show a steep decline in standard prompt engineers, with high demands for engineers skilled in LangGraph and Supabase integrations.',
  'Companies are looking for developers who can orchestrate complex multi-agent workflows using persistent databases and backend SDKs. The era of simple input-output prompting is giving way to robust software engineering practices within the AI stack.',
  115,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  '1:50',
  'The job market for AI engineering is shifting rapidly. Standard prompting skills are no longer sufficient. Modern companies seek engineers who understand database states, state machines, and client SDKs like Supabase. Building scalable, deterministic AI pipelines is the new gold standard.'
)
on conflict do nothing;
