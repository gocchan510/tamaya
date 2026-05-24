-- festivals: 大会固定情報
create table festivals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prefecture text not null,
  city text not null,
  lat numeric(9,6) not null,
  lng numeric(9,6) not null,
  official_url text,
  description text,
  ranking_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- festival_years: 年次情報
create table festival_years (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  year integer not null,
  date date,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'postponed')),
  fireworks_count integer,
  expected_attendance integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (festival_id, year)
);

-- lottery_periods: 有料席抽選情報
create table lottery_periods (
  id uuid primary key default gen_random_uuid(),
  festival_year_id uuid not null references festival_years(id) on delete cascade,
  seat_name text not null,
  lottery_start_at timestamptz,
  lottery_end_at timestamptz,
  price_min integer,
  price_max integer,
  lottery_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- weather_cache: 天気キャッシュ（3時間ごと）
create table weather_cache (
  id uuid primary key default gen_random_uuid(),
  festival_year_id uuid not null references festival_years(id) on delete cascade,
  forecast_time timestamptz not null,
  fetched_at timestamptz not null default now(),
  condition text,
  temperature numeric(4,1),
  precip_prob integer,
  raw_json jsonb,
  unique (festival_year_id, forecast_time)
);

-- users: Supabase authと連携
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  push_subscription jsonb,
  created_at timestamptz not null default now()
);

-- user_favorites: お気に入り（ログインユーザー）
create table user_favorites (
  user_id uuid not null references users(id) on delete cascade,
  festival_id uuid not null references festivals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, festival_id)
);

-- notification_subscriptions: 抽選通知設定
create table notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  lottery_period_id uuid not null references lottery_periods(id) on delete cascade,
  notify_start boolean not null default true,
  notify_end boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, lottery_period_id)
);

-- data_submissions: ユーザー投稿（管理画面でレビュー）
create table data_submissions (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid references festivals(id) on delete set null,
  festival_year_id uuid references festival_years(id) on delete set null,
  submitted_by uuid references users(id) on delete set null,
  type text not null check (type in ('new_festival', 'update_info', 'lottery_info')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references users(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger festivals_updated_at before update on festivals
  for each row execute function update_updated_at();
create trigger festival_years_updated_at before update on festival_years
  for each row execute function update_updated_at();
create trigger lottery_periods_updated_at before update on lottery_periods
  for each row execute function update_updated_at();
create trigger data_submissions_updated_at before update on data_submissions
  for each row execute function update_updated_at();

-- RLS（Row Level Security）
alter table festivals enable row level security;
alter table festival_years enable row level security;
alter table lottery_periods enable row level security;
alter table weather_cache enable row level security;
alter table users enable row level security;
alter table user_favorites enable row level security;
alter table notification_subscriptions enable row level security;
alter table data_submissions enable row level security;

-- 全員読み取り可
create policy "public read festivals" on festivals for select using (true);
create policy "public read festival_years" on festival_years for select using (true);
create policy "public read lottery_periods" on lottery_periods for select using (true);
create policy "public read weather_cache" on weather_cache for select using (true);

-- ユーザー自身のデータのみ操作可
create policy "users manage own favorites" on user_favorites
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own notifications" on notification_subscriptions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own profile" on users
  using (auth.uid() = id) with check (auth.uid() = id);

-- 投稿は誰でも可、閲覧は本人のみ
create policy "users submit data" on data_submissions for insert
  with check (auth.uid() = submitted_by or submitted_by is null);
create policy "users read own submissions" on data_submissions for select
  using (auth.uid() = submitted_by);
