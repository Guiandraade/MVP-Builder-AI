-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table (linked to auth.users)
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  pinned boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_pinned_updated_at on public.conversations(user_id, pinned, updated_at desc);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);

-- Backfill schema for existing databases
alter table public.conversations
  add column if not exists pinned boolean default false not null;

-- Enable Row Level Security
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- RLS Policies for conversations
create policy "Users can view their own conversations" on public.conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert their own conversations" on public.conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own conversations" on public.conversations
  for update using (auth.uid() = user_id);

create policy "Users can delete their own conversations" on public.conversations
  for delete using (auth.uid() = user_id);

-- RLS Policies for messages
create policy "Users can view messages from their conversations" on public.messages
  for select using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their conversations" on public.messages
  for insert with check (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can delete messages from their conversations" on public.messages
  for delete using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );
