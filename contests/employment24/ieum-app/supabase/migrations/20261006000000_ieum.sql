create table public.company_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint profile_object check (jsonb_typeof(profile) = 'object'),
  constraint profile_size check (octet_length(profile::text) <= 410000)
);
alter table public.company_profiles enable row level security;
grant select, insert, update, delete on public.company_profiles to authenticated;
revoke all on public.company_profiles from anon;
create policy "Read own profile" on public.company_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own profile" on public.company_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own profile" on public.company_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own profile" on public.company_profiles for delete to authenticated using ((select auth.uid()) = user_id);
create function public.touch_profile() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger touch_profile before update on public.company_profiles for each row execute function public.touch_profile();

-- Atomic daily budget prevents concurrent requests from bypassing the LLM limit.
create table public.chat_usage (
  user_id uuid references auth.users(id) on delete cascade,
  day date not null,
  requests integer not null default 0,
  primary key (user_id, day)
);
alter table public.chat_usage enable row level security;
revoke all on public.chat_usage from anon, authenticated;
create function public.claim_chat_request() returns boolean
language plpgsql security definer set search_path = '' as $$
declare count integer;
begin
  if auth.uid() is null then return false; end if;
  insert into public.chat_usage (user_id, day, requests) values (auth.uid(), (now() at time zone 'UTC')::date, 1)
  on conflict (user_id, day) do update set requests = public.chat_usage.requests + 1
  where public.chat_usage.requests < 30
  returning requests into count;
  return count is not null;
end;
$$;
revoke all on function public.claim_chat_request() from public, anon;
grant execute on function public.claim_chat_request() to authenticated;
