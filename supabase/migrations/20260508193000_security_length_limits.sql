-- Enforce safe text limits to prevent oversized writes.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_title_length_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_title_length_check
      check (char_length(title) between 1 and 120) not valid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_content_length_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_content_length_check
      check (char_length(content) between 1 and 8000) not valid;
  end if;
end
$$;
