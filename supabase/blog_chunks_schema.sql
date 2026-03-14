-- Enable pgvector (run this first if not already enabled)
create extension if not exists vector;

-- Blog content chunks for RAG
create table if not exists blog_chunks (
  id        bigserial primary key,
  url       text not null,
  title     text,
  content   text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Fast cosine similarity search
create index if not exists blog_chunks_embedding_idx
  on blog_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RLS
alter table blog_chunks enable row level security;

create policy "Public can read blog chunks"
  on blog_chunks for select using (true);

create policy "Service can insert blog chunks"
  on blog_chunks for insert with check (true);

-- Similarity search function
create or replace function match_blog_chunks(
  query_embedding vector(1536),
  match_count     int default 5,
  min_similarity  float default 0.3
)
returns table (url text, title text, content text, similarity float)
language sql stable as $$
  select url, title, content,
         1 - (embedding <=> query_embedding) as similarity
  from   blog_chunks
  where  1 - (embedding <=> query_embedding) > min_similarity
  order  by embedding <=> query_embedding
  limit  match_count;
$$;
