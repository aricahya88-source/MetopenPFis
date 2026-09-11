-- METOPEN PFIS — Supabase/PostgreSQL schema
-- Jalankan file ini di Supabase SQL Editor sebelum migrasi data.

create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create table if not exists public.users (
  user_id text primary key,
  nim text not null unique,
  name text not null,
  email text,
  role text not null default 'mahasiswa' check (role in ('mahasiswa','dosen','admin')),
  class_name text default '',
  pin_salt text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists users_email_unique on public.users(lower(email)) where email is not null and email <> '';

create table if not exists public.weeks (
  week_id text primary key,
  week_no integer not null unique,
  title text not null,
  summary_html text default '',
  open_at timestamptz,
  close_at timestamptz,
  visible boolean not null default true,
  updated_at timestamptz default now()
);

create table if not exists public.materials (
  material_id text primary key,
  week_id text not null references public.weeks(week_id) on delete cascade,
  material_no integer default 0,
  order_no integer default 0,
  title text not null,
  content_html text default '',
  resource_url text default '',
  visible boolean not null default true,
  updated_at timestamptz default now()
);
create index if not exists materials_week_idx on public.materials(week_id, order_no);

create table if not exists public.activities (
  activity_id text primary key,
  week_id text references public.weeks(week_id) on delete set null,
  type text not null default 'assignment',
  title text not null,
  description_html text default '',
  mode text default 'individual',
  max_score numeric default 100,
  due_at timestamptz,
  visible boolean not null default true,
  allow_comments boolean not null default true,
  project_code text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists activities_week_idx on public.activities(week_id);

create table if not exists public.discussions (
  discussion_id text primary key,
  activity_id text not null unique references public.activities(activity_id) on delete cascade,
  prompt_html text default '',
  min_posts integer default 1,
  grading_mode text default 'manual',
  updated_at timestamptz default now()
);

create table if not exists public.posts (
  post_id text primary key,
  discussion_id text not null references public.discussions(discussion_id) on delete cascade,
  user_id text not null references public.users(user_id) on delete cascade,
  parent_post_id text default '',
  content_html text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  status text default 'active'
);
create index if not exists posts_discussion_idx on public.posts(discussion_id, created_at);

create table if not exists public.comments (
  comment_id text primary key,
  entity_type text,
  entity_id text,
  user_id text references public.users(user_id) on delete set null,
  parent_comment_id text default '',
  content_html text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.submissions (
  submission_id text primary key,
  activity_id text not null references public.activities(activity_id) on delete cascade,
  user_id text not null references public.users(user_id) on delete cascade,
  group_id text default '',
  version integer not null default 1,
  content_html text default '',
  link_url text default '',
  file_name text default '',
  file_url text default '',
  status text default 'submitted',
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists submissions_user_activity_idx on public.submissions(user_id, activity_id, version desc);
create index if not exists submissions_public_idx on public.submissions(activity_id, status, submitted_at desc);

-- Lima sumber artikel Tugas 1 disimpan terstruktur dan ikut versioning submission.
create table if not exists public.submission_articles (
  article_id text primary key,
  submission_id text not null references public.submissions(submission_id) on delete cascade,
  slot_no integer not null check (slot_no between 1 and 5),
  url text default '',
  file_name text default '',
  file_url text default '',
  mime_type text default '',
  created_at timestamptz default now(),
  unique(submission_id, slot_no)
);
create index if not exists submission_articles_submission_idx on public.submission_articles(submission_id, slot_no);

create table if not exists public.grades (
  grade_id text primary key,
  activity_id text not null references public.activities(activity_id) on delete cascade,
  user_id text not null references public.users(user_id) on delete cascade,
  submission_id text default '',
  score numeric not null default 0,
  max_score numeric not null default 100,
  feedback_html text default '',
  published boolean not null default false,
  graded_by text default '',
  graded_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists grades_user_activity_idx on public.grades(user_id, activity_id, graded_at desc);

create table if not exists public.rubrics (
  rubric_id text primary key,
  activity_id text not null unique references public.activities(activity_id) on delete cascade,
  name text not null,
  criteria_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.rubric_scores (
  rubric_score_id text primary key,
  rubric_id text not null references public.rubrics(rubric_id) on delete cascade,
  user_id text not null references public.users(user_id) on delete cascade,
  submission_id text default '',
  scores_json jsonb not null default '{}'::jsonb,
  total_score numeric default 0,
  graded_by text default '',
  graded_at timestamptz default now()
);
create index if not exists rubric_scores_user_idx on public.rubric_scores(rubric_id, user_id, graded_at desc);

-- Tabel kompatibilitas data lama. Belum dipakai UI saat ini, tetapi dipertahankan agar migrasi tidak membuang data.
create table if not exists public.quizzes (
  quiz_id text primary key,
  activity_id text references public.activities(activity_id) on delete cascade,
  instructions_html text default '', attempt_limit integer default 1,
  show_feedback boolean default true, shuffle_questions boolean default false,
  updated_at timestamptz default now()
);
create table if not exists public.quiz_questions (
  question_id text primary key, quiz_id text references public.quizzes(quiz_id) on delete cascade,
  order_no integer default 0, question_html text default '', option_a_html text default '', option_b_html text default '', option_c_html text default '', option_d_html text default '', correct_option text default '', points numeric default 1, explanation_html text default '', updated_at timestamptz default now()
);
create table if not exists public.quiz_attempts (
  attempt_id text primary key, quiz_id text, user_id text references public.users(user_id) on delete cascade,
  attempt_no integer default 1, answers_json jsonb default '{}'::jsonb, score numeric default 0, max_score numeric default 100, percentage numeric default 0, submitted_at timestamptz default now()
);
create table if not exists public.groups (
  group_id text primary key, project_code text default '', name text not null, meeting_no integer, topic text default '', created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.group_members (
  membership_id text primary key, group_id text references public.groups(group_id) on delete cascade, user_id text references public.users(user_id) on delete cascade, role text default 'member', created_at timestamptz default now()
);
create table if not exists public.project_plans (
  plan_id text primary key, project_code text default '', user_id text references public.users(user_id) on delete cascade, group_id text default '', title text default '', theme_code text default '', topic text default '', maharah_json jsonb default '[]'::jsonb, target_users_html text default '', problem_html text default '', objectives_html text default '', features_html text default '', flow_html text default '', technology_html text default '', test_plan_html text default '', team_html text default '', detail_json jsonb default '{}'::jsonb, status text default 'DRAFT', revision_no integer default 1, lecturer_feedback_html text default '', submitted_at timestamptz, approved_at timestamptz, updated_at timestamptz default now()
);

create table if not exists public.announcements (
  announcement_id text primary key,
  title text not null,
  content_html text default '',
  published_at timestamptz default now(),
  visible boolean not null default true,
  created_by text default '',
  updated_at timestamptz default now()
);

create table if not exists public.activity_log (
  log_id text primary key,
  user_id text default '',
  action text not null,
  entity_type text default '',
  entity_id text default '',
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

insert into public.settings(key,value,updated_at) values
  ('APP_NAME','METOPEN PFIS',now()),
  ('COURSE_NAME','Metode Penelitian Pendidikan Fisika',now()),
  ('COURSE_CODE','PFS115036',now()),
  ('CURRENT_WEEK','1',now()),
  ('WEEK_MODE','MANUAL',now())
on conflict (key) do nothing;

-- Database hanya diakses server Next.js memakai service-role key.
-- Anon/authenticated client Supabase tidak memiliki policy langsung.
do $$
declare t text;
begin
  foreach t in array array['settings','users','weeks','materials','activities','discussions','posts','comments','submissions','submission_articles','grades','rubrics','rubric_scores','quizzes','quiz_questions','quiz_attempts','groups','group_members','project_plans','announcements','activity_log']
  loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;
