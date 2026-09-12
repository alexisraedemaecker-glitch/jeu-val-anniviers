-- =====================================================================
-- Securite : RLS, droits, stockage des photos, temps reel.
-- Principe : le navigateur peut tout lire (c'est un album collectif entre
-- proches) mais ne peut rien ecrire directement. Toute ecriture passe par
-- les fonctions security definer de 02_functions.sql.
-- Idempotent, peut etre rejoue sans danger.
-- =====================================================================

-- ------------------------------------------------------------------- RLS

alter table public.pillars            enable row level security;
alter table public.challenges         enable row level security;
alter table public.synergies          enable row level security;
alter table public.participants       enable row level security;
alter table public.submissions        enable row level security;
alter table public.submission_members enable row level security;
alter table public.synergy_unlocks    enable row level security;
alter table public.quiz_lockouts      enable row level security;
alter table public.app_settings       enable row level security;

do $$
declare t text;
begin
  foreach t in array array['pillars','challenges','synergies','participants',
                           'submissions','submission_members','synergy_unlocks',
                           'quiz_lockouts']
  loop
    execute format('drop policy if exists %I on public.%I', 'lecture_publique_' || t, t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      'lecture_publique_' || t, t);
  end loop;
end;
$$;

-- app_settings : RLS activee et aucune policy, donc totalement inaccessible
-- depuis le navigateur. Seules les fonctions security definer y accedent.

-- ---------------------------------------------------------------- droits

revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on
  public.pillars, public.challenges, public.synergies, public.participants,
  public.submissions, public.submission_members, public.synergy_unlocks,
  public.quiz_lockouts
to anon, authenticated;

grant select on
  public.v_submission_gauge, public.v_synergy_gauge, public.v_pillar_gauges,
  public.v_personal_scores, public.v_collective_status, public.v_challenge_stats,
  public.v_feed, public.v_lockouts
to anon, authenticated;

-- Fonctions appelables depuis l'application.
revoke all on function public.recompute_synergies() from anon, authenticated;
grant execute on function public.ensure_participant(text, text, text) to anon, authenticated;
grant execute on function public.set_vibe(uuid, text)                 to anon, authenticated;
grant execute on function public.submit_challenge(text, text, uuid, uuid[], text, text, int, int) to anon, authenticated;
grant execute on function public.check_organizer(text)                to anon, authenticated;
grant execute on function public.delete_submission(uuid, text)        to anon, authenticated;
grant execute on function public.game_state()                         to anon, authenticated;
grant execute on function public.photo_est_orpheline(text)            to anon, authenticated;
grant execute on function public.lockout_minutes()                    to anon, authenticated;
grant execute on function public.lockout_until(uuid, text)            to anon, authenticated;
grant execute on function public.report_quiz_failure(text, text, uuid, uuid[]) to anon, authenticated;

-- Administration. Chacune verifie le code organisateur avant d'agir, le droit
-- d'appel ne suffit donc pas a en faire quoi que ce soit.
grant execute on function public.admin_clear_lockouts(text, uuid, text)        to anon, authenticated;
grant execute on function public.admin_rename_participant(text, uuid, text, text) to anon, authenticated;
grant execute on function public.admin_delete_participant(text, uuid)          to anon, authenticated;
grant execute on function public.admin_reset_game(text, text)                  to anon, authenticated;
grant execute on function public.admin_set_lockout_minutes(text, int)          to anon, authenticated;

-- -------------------------------------------------------------- stockage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('preuves', 'preuves', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "preuves lecture"   on storage.objects;
drop policy if exists "preuves depot"     on storage.objects;
drop policy if exists "preuves menage"    on storage.objects;

create policy "preuves lecture" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'preuves');

create policy "preuves depot" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'preuves');

-- Supabase interdit la suppression directe en SQL dans storage.objects, il faut
-- passer par son API depuis le navigateur. Pour que ce ne soit pas une porte
-- ouverte, la policy n'autorise que les photos devenues orphelines, c'est a dire
-- celles dont la soumission a deja ete supprimee par un organisateur muni du
-- code. Une photo rattachee a une soumission vivante reste intouchable.
create policy "preuves menage" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'preuves' and public.photo_est_orpheline(name));

-- Pas de policy update : une photo deposee ne peut jamais etre ecrasee.

-- ------------------------------------------------------------- temps reel

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['submissions','submission_members','synergy_unlocks',
                           'participants','quiz_lockouts']
  loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Les evenements DELETE du temps reel ne transportent la ligne complete que si
-- l'identite de replication est complete. L'application se contente d'un signal
-- de rafraichissement, mais autant que le signal soit fiable.
alter table public.submissions        replica identity full;
alter table public.submission_members replica identity full;
alter table public.synergy_unlocks    replica identity full;
alter table public.quiz_lockouts      replica identity full;
