-- Reviews table for Sofia Audio Guide
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  rating      integer not null check (rating >= 1 and rating <= 5),
  comment     text not null,
  approved    boolean not null default false,
  created_at  timestamptz not null default now(),
  honeypot    text  -- must be empty; used to catch bots
);

-- Fast reads for public review display
create index if not exists reviews_approved_created_at_idx
  on reviews (approved, created_at desc);

-- Row Level Security
alter table reviews enable row level security;

-- Public can read approved reviews
create policy "Public read approved reviews"
  on reviews for select
  using (approved = true);

-- Anyone can insert (moderated via approved flag)
create policy "Anyone can submit a review"
  on reviews for insert
  with check (true);

-- No public update or delete
