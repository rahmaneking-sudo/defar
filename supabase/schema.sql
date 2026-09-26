-- ─────────────────────────────────────────────────────────────────────────────
-- Défar — base de données (Supabase)
-- À coller une seule fois dans Supabase : SQL Editor → New query → Run.
-- Le script peut être relancé sans danger (il met à jour ce qui existe déjà).
--
-- Contenu :
--   profiles       comptes (crédits, forfait, admin)
--   sites          maquettes / sites des clients (brouillon + version publiée)
--   submissions    messages, commandes et réservations reçus par les sites publiés
--   credit_events  historique des crédits
--   feedback       avis des testeurs
--   + fonctions sécurisées (dépense de crédits, publication, formulaires, admin)
--   + dossier de photos « media »
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════ Tables ═══════════════════════════

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text not null default '',
  credits integer not null default 50 check (credits >= 0),
  plan text not null default 'essai',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default 'Sans titre' check (char_length(name) <= 120),
  idea text not null default '' check (char_length(idea) <= 2000),
  spec jsonb not null check (octet_length(spec::text) <= 900000),
  cover text not null default '' check (char_length(cover) <= 1000),
  color text not null default '' check (char_length(color) <= 20),
  slug text unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'),
  published boolean not null default false,
  published_spec jsonb,
  published_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sites_owner_idx on public.sites (owner, updated_at desc);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  kind text not null default 'message',
  data jsonb not null,
  status text not null default 'nouveau' check (status in ('nouveau', 'lu', 'traite')),
  created_at timestamptz not null default now()
);
create index if not exists submissions_site_idx on public.submissions (site_id, created_at desc);

create table if not exists public.credit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists credit_events_user_idx on public.credit_events (user_id, created_at desc);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  email text check (char_length(email) <= 200),
  rating integer check (rating between 1 and 5),
  message text not null default '' check (char_length(message) <= 4000),
  page text not null default '' check (char_length(page) <= 200),
  created_at timestamptz not null default now()
);

-- ═══════════════════════════ Fonctions utilitaires ═══════════════════════════

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

-- Nombre de sites publiés autorisés par forfait
create or replace function public.plan_site_limit(p_plan text) returns integer
language sql immutable set search_path = '' as $$
  select case coalesce(p_plan, 'essai')
    when 'gratuit' then 1
    when 'essai' then 3
    when 'starter' then 3
    when 'pro' then 10
    when 'agence' then 50
    else 1 end
$$;

-- Mise à jour automatique de sites.updated_at
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists sites_touch on public.sites;
create trigger sites_touch before update on public.sites
  for each row execute function public.touch_updated_at();

-- Limite anti-abus : 60 projets par compte
create or replace function public.limit_sites() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.sites s where s.owner = new.owner) >= 60 then
    raise exception 'LIMITE_PROJETS';
  end if;
  return new;
end $$;
drop trigger if exists sites_limit on public.sites;
create trigger sites_limit before insert on public.sites
  for each row execute function public.limit_sites();

-- Nouveau compte : profil + crédits de bienvenue
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_credits integer;
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30)
  )
  on conflict (id) do nothing
  returning credits into v_credits;
  if v_credits is not null and v_credits > 0 then
    insert into public.credit_events (user_id, delta, reason) values (new.id, v_credits, 'Crédits de bienvenue');
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════ Fonctions appelées par le site ═══════════════════════════

-- Dépense des crédits (appelée par le serveur Défar avec le jeton de l'utilisateur)
create or replace function public.spend_credits(p_amount integer, p_reason text default '') returns integer
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_left integer;
begin
  if v_uid is null then raise exception 'NON_CONNECTE'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 100 then raise exception 'MONTANT_INVALIDE'; end if;
  update public.profiles set credits = credits - p_amount
    where id = v_uid and credits >= p_amount
    returning credits into v_left;
  if v_left is null then raise exception 'CREDITS_INSUFFISANTS'; end if;
  insert into public.credit_events (user_id, delta, reason) values (v_uid, -p_amount, left(coalesce(p_reason, ''), 120));
  return v_left;
end $$;

-- Dernière visite (pour la page admin)
create or replace function public.touch_profile() returns void
language sql security definer set search_path = '' as $$
  update public.profiles set last_seen_at = now() where id = auth.uid()
$$;

-- Adresse libre ?
create or replace function public.slug_available(p_slug text, p_site uuid default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select lower(coalesce(p_slug, '')) ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'
    and not (lower(p_slug) = any (array['www','app','api','admin','studio','espace','connexion','inscription','tarifs','galerie','pay','paiements','s','p','render','defar','support','aide','help','blog','mail','static','assets','media','export','compte','site','sites','demo']))
    and not exists (select 1 from public.sites s where s.slug = lower(p_slug) and s.id is distinct from p_site)
$$;

-- Publier (ou republier) un site : copie le brouillon dans la version publiée
create or replace function public.publish_site(p_site uuid, p_slug text, p_whatsapp text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_slug text := lower(trim(coalesce(p_slug, '')));
  v_site public.sites;
  v_count integer;
  v_plan text;
begin
  if v_uid is null then raise exception 'NON_CONNECTE'; end if;
  select * into v_site from public.sites where id = p_site and owner = v_uid for update;
  if not found then raise exception 'SITE_INTROUVABLE'; end if;
  if v_slug !~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$' then raise exception 'ADRESSE_INVALIDE'; end if;
  if not public.slug_available(v_slug, p_site) then
    if exists (select 1 from public.sites s where s.slug = v_slug and s.id <> p_site) then raise exception 'ADRESSE_PRISE'; end if;
    raise exception 'ADRESSE_RESERVEE';
  end if;
  if not v_site.published then
    select plan into v_plan from public.profiles where id = v_uid;
    select count(*) into v_count from public.sites where owner = v_uid and published;
    if v_count >= public.plan_site_limit(v_plan) then raise exception 'LIMITE_SITES'; end if;
  end if;
  update public.sites set
    slug = v_slug,
    published = true,
    published_spec = spec,
    published_at = now(),
    settings = case
      when p_whatsapp is null then settings
      else jsonb_set(settings, '{whatsapp}', to_jsonb(left(regexp_replace(p_whatsapp, '\D', '', 'g'), 15)))
    end
  where id = p_site;
  return v_slug;
end $$;

create or replace function public.unpublish_site(p_site uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'NON_CONNECTE'; end if;
  update public.sites set published = false where id = p_site and owner = auth.uid();
  if not found then raise exception 'SITE_INTROUVABLE'; end if;
end $$;

-- Lecture publique d'un site publié (seule la version publiée est visible)
create or replace function public.get_public_site(p_slug text, p_count boolean default true) returns json
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  select s.id, s.slug, s.name, s.published_spec, s.settings, s.published_at into r
    from public.sites s where s.slug = lower(coalesce(p_slug, '')) and s.published;
  if not found then return null; end if;
  if p_count then update public.sites set views = views + 1 where id = r.id; end if;
  return json_build_object('id', r.id, 'slug', r.slug, 'name', r.name, 'spec', r.published_spec,
    'whatsapp', coalesce(r.settings ->> 'whatsapp', ''), 'published_at', r.published_at);
end $$;

-- Formulaire envoyé par un visiteur d'un site publié (message, commande, réservation…)
create or replace function public.submit_form(p_slug text, p_kind text, p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_site uuid; v_id uuid; v_n integer; v_kind text := coalesce(p_kind, 'message');
begin
  select id into v_site from public.sites where slug = lower(coalesce(p_slug, '')) and published;
  if v_site is null then raise exception 'SITE_INTROUVABLE'; end if;
  if v_kind not in ('message', 'commande', 'reservation', 'inscription', 'abonnement') then v_kind := 'message'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 16000 then
    raise exception 'DONNEES_INVALIDES';
  end if;
  select count(*) into v_n from public.submissions where site_id = v_site and created_at > now() - interval '1 day';
  if v_n >= 500 then raise exception 'TROP_DE_MESSAGES'; end if;
  insert into public.submissions (site_id, kind, data) values (v_site, v_kind, p_data) returning id into v_id;
  return v_id;
end $$;

-- ═══════════════════════════ Fonctions admin ═══════════════════════════

create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_SEULEMENT'; end if;
  return json_build_object(
    'users', (select count(*) from public.profiles),
    'users_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'active_7d', (select count(*) from public.profiles where last_seen_at > now() - interval '7 days'),
    'sites', (select count(*) from public.sites),
    'published', (select count(*) from public.sites where published),
    'submissions', (select count(*) from public.submissions),
    'feedback', (select count(*) from public.feedback),
    'rating', (select round(avg(rating)::numeric, 1) from public.feedback where rating is not null),
    'credits_spent', (select coalesce(-sum(delta), 0) from public.credit_events where delta < 0)
  );
end $$;

create or replace function public.admin_users(p_search text default '') returns table (
  id uuid, email text, full_name text, phone text, credits integer, plan text, is_admin boolean,
  created_at timestamptz, last_seen_at timestamptz, sites bigint, published bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_SEULEMENT'; end if;
  return query
    select p.id, p.email, p.full_name, p.phone, p.credits, p.plan, p.is_admin, p.created_at, p.last_seen_at,
      (select count(*) from public.sites s where s.owner = p.id),
      (select count(*) from public.sites s where s.owner = p.id and s.published)
    from public.profiles p
    where coalesce(p_search, '') = ''
      or p.email ilike '%' || p_search || '%'
      or p.full_name ilike '%' || p_search || '%'
      or p.phone ilike '%' || p_search || '%'
    order by p.created_at desc
    limit 500;
end $$;

create or replace function public.admin_sites() returns table (
  id uuid, name text, slug text, published boolean, views integer, owner_email text,
  created_at timestamptz, updated_at timestamptz, submissions bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_SEULEMENT'; end if;
  return query
    select s.id, s.name, s.slug, s.published, s.views, p.email, s.created_at, s.updated_at,
      (select count(*) from public.submissions m where m.site_id = s.id)
    from public.sites s left join public.profiles p on p.id = s.owner
    order by s.updated_at desc
    limit 500;
end $$;

create or replace function public.admin_grant_credits(p_user uuid, p_amount integer, p_reason text default '') returns integer
language plpgsql security definer set search_path = '' as $$
declare v_credits integer;
begin
  if not public.is_admin() then raise exception 'ADMIN_SEULEMENT'; end if;
  if p_amount is null or p_amount = 0 or abs(p_amount) > 100000 then raise exception 'MONTANT_INVALIDE'; end if;
  update public.profiles set credits = greatest(0, credits + p_amount) where id = p_user returning credits into v_credits;
  if v_credits is null then raise exception 'COMPTE_INTROUVABLE'; end if;
  insert into public.credit_events (user_id, delta, reason)
    values (p_user, p_amount, left(coalesce(nullif(p_reason, ''), 'Crédits ajoutés par Défar'), 120));
  return v_credits;
end $$;

create or replace function public.admin_set_plan(p_user uuid, p_plan text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_SEULEMENT'; end if;
  if p_plan not in ('gratuit', 'essai', 'starter', 'pro', 'agence') then raise exception 'FORFAIT_INVALIDE'; end if;
  update public.profiles set plan = p_plan where id = p_user;
end $$;

-- ═══════════════════════════ Sécurité : qui peut faire quoi ═══════════════════════════

alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.submissions enable row level security;
alter table public.credit_events enable row level security;
alter table public.feedback enable row level security;

-- Droits de base : tout est fermé, puis on ouvre le strict nécessaire
revoke all on public.profiles, public.sites, public.submissions, public.credit_events, public.feedback from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

grant select, delete on public.sites to authenticated;
grant insert (id, name, idea, spec, cover, color) on public.sites to authenticated;
grant update (name, idea, spec, cover, color) on public.sites to authenticated;

grant select, delete on public.submissions to authenticated;
grant update (status) on public.submissions to authenticated;

grant select on public.credit_events to authenticated;

grant insert (email, rating, message, page) on public.feedback to anon, authenticated;
grant select, delete on public.feedback to authenticated;

-- Règles par ligne
drop policy if exists "profil : lecture" on public.profiles;
create policy "profil : lecture" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profil : modification" on public.profiles;
create policy "profil : modification" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "sites : lecture" on public.sites;
create policy "sites : lecture" on public.sites for select to authenticated
  using (owner = auth.uid() or public.is_admin());
drop policy if exists "sites : création" on public.sites;
create policy "sites : création" on public.sites for insert to authenticated
  with check (owner = auth.uid());
drop policy if exists "sites : modification" on public.sites;
create policy "sites : modification" on public.sites for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists "sites : suppression" on public.sites;
create policy "sites : suppression" on public.sites for delete to authenticated
  using (owner = auth.uid());

drop policy if exists "messages : lecture" on public.submissions;
create policy "messages : lecture" on public.submissions for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner = auth.uid()));
drop policy if exists "messages : statut" on public.submissions;
create policy "messages : statut" on public.submissions for update to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner = auth.uid()));
drop policy if exists "messages : suppression" on public.submissions;
create policy "messages : suppression" on public.submissions for delete to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner = auth.uid()));

drop policy if exists "crédits : lecture" on public.credit_events;
create policy "crédits : lecture" on public.credit_events for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "avis : envoi" on public.feedback;
create policy "avis : envoi" on public.feedback for insert to anon, authenticated
  with check (user_id is not distinct from auth.uid());
drop policy if exists "avis : lecture admin" on public.feedback;
create policy "avis : lecture admin" on public.feedback for select to authenticated
  using (public.is_admin());
drop policy if exists "avis : suppression admin" on public.feedback;
create policy "avis : suppression admin" on public.feedback for delete to authenticated
  using (public.is_admin());

-- Fonctions : réservées aux personnes connectées, sauf lecture publique et formulaires
revoke execute on function public.spend_credits(integer, text) from public, anon;
revoke execute on function public.touch_profile() from public, anon;
revoke execute on function public.publish_site(uuid, text, text) from public, anon;
revoke execute on function public.unpublish_site(uuid) from public, anon;
revoke execute on function public.admin_stats() from public, anon;
revoke execute on function public.admin_users(text) from public, anon;
revoke execute on function public.admin_sites() from public, anon;
revoke execute on function public.admin_grant_credits(uuid, integer, text) from public, anon;
revoke execute on function public.admin_set_plan(uuid, text) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.limit_sites() from public, anon, authenticated;
grant execute on function public.spend_credits(integer, text) to authenticated;
grant execute on function public.touch_profile() to authenticated;
grant execute on function public.publish_site(uuid, text, text) to authenticated;
grant execute on function public.unpublish_site(uuid) to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_users(text) to authenticated;
grant execute on function public.admin_sites() to authenticated;
grant execute on function public.admin_grant_credits(uuid, integer, text) to authenticated;
grant execute on function public.admin_set_plan(uuid, text) to authenticated;
grant execute on function public.slug_available(text, uuid) to anon, authenticated;
grant execute on function public.get_public_site(text, boolean) to anon, authenticated;
grant execute on function public.submit_form(text, text, jsonb) to anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.plan_site_limit(text) to anon, authenticated;

-- ═══════════════════════════ Photos envoyées par les clients ═══════════════════════════
-- Dossier public « media » : chaque compte écrit uniquement dans son sous-dossier.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "media : envoi" on storage.objects;
create policy "media : envoi" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media : lecture" on storage.objects;
create policy "media : lecture" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media : suppression" on storage.objects;
create policy "media : suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
