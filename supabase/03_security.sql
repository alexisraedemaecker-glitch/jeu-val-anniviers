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
alter table public.participant_secrets enable row level security;
alter table public.posts             enable row level security;
alter table public.post_kudos        enable row level security;
alter table public.post_comments     enable row level security;
alter table public.notifications     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['pillars','challenges','synergies','participants',
                           'submissions','submission_members','synergy_unlocks',
                           'quiz_lockouts','posts','post_kudos','post_comments']
  loop
    execute format('drop policy if exists %I on public.%I', 'lecture_publique_' || t, t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      'lecture_publique_' || t, t);
  end loop;
end;
$$;

-- app_settings et participant_secrets : RLS activee et aucune policy, donc
-- totalement inaccessibles depuis le navigateur. Seules les fonctions security
-- definer y accedent. Une empreinte de mot de passe ne sort jamais de la base.
-- notifications : pas de policy non plus, elles ne se lisent que par
-- feed_state(), qui ne renvoie que les siennes.

-- ---------------------------------------------------------------- droits

revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on
  public.pillars, public.challenges, public.synergies, public.participants,
  public.submissions, public.submission_members, public.synergy_unlocks,
  public.quiz_lockouts, public.posts, public.post_kudos, public.post_comments
to anon, authenticated;

grant select on
  public.v_submission_gauge, public.v_synergy_gauge, public.v_pillar_gauges,
  public.v_personal_scores, public.v_collective_status, public.v_challenge_stats,
  public.v_feed, public.v_lockouts, public.v_posts
to anon, authenticated;

-- Fonctions internes. En PostgreSQL, une fonction est exécutable par PUBLIC
-- dès sa création : retirer le droit à anon et authenticated ne suffit pas,
-- il faut le retirer à PUBLIC, sinon tout le monde le garde par héritage.
-- Ces fonctions ne sont appelées que par d'autres fonctions security definer,
-- qui s'exécutent avec les droits de leur propriétaire.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as signature
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('recompute_synergies','verifie_code','set_code','notifier',
                         'push_a_envoyer','push_echec','declenche_push')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
  end loop;
end;
$$;

-- La fonction Edge se présente avec la clé de service : elle seule prépare et
-- marque les envois.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as signature
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname in ('push_a_envoyer','push_echec')
  loop
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end;
$$;

-- Fonctions appelables depuis l'application.
revoke all on function public.recompute_synergies() from anon, authenticated;
grant execute on function public.ensure_participant(text, text, text, text, text) to anon, authenticated;
grant execute on function public.a_un_code(uuid)                      to anon, authenticated;
grant execute on function public.code_valide(text)                    to anon, authenticated;
-- verifie_code et set_code ne sont pas exposees : la verification se fait a
-- l'interieur de ensure_participant, qui ne renvoie le profil qu'au bon code.
-- Leur retrait est traite plus haut, avec les autres fonctions internes.
grant execute on function public.add_post(text, uuid, text, text, uuid[])       to anon, authenticated;
grant execute on function public.add_comment(text, uuid, uuid, text, uuid[])    to anon, authenticated;
grant execute on function public.toggle_kudo(uuid, uuid)                        to anon, authenticated;
grant execute on function public.mark_notifications_read(uuid)                  to anon, authenticated;
grant execute on function public.delete_post(uuid, uuid, text)                  to anon, authenticated;
grant execute on function public.feed_state(uuid)                               to anon, authenticated;
grant execute on function public.photo_post_est_orpheline(text)                 to anon, authenticated;
grant execute on function public.set_photo(uuid, text)                to anon, authenticated;
grant execute on function public.portrait_est_orphelin(text)          to anon, authenticated;
grant execute on function public.chemin_valide(text)                  to anon, authenticated;
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
grant execute on function public.admin_reset_code(text, uuid, text)            to anon, authenticated;

-- -------------------------------------------------------------- stockage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('preuves', 'preuves', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profils', 'profils', true, 2097152,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "profils lecture" on storage.objects;
drop policy if exists "profils depot"   on storage.objects;
drop policy if exists "profils menage"  on storage.objects;

create policy "profils lecture" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'profils');

create policy "profils depot" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'profils');

-- Comme pour les preuves : on ne peut retirer qu'un portrait devenu orphelin,
-- donc apres suppression du profil correspondant.
create policy "profils menage" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'profils' and public.portrait_est_orphelin(name));

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
  using (bucket_id = 'preuves'
         and public.photo_est_orpheline(name)
         and public.photo_post_est_orpheline(name));

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
                           'participants','quiz_lockouts','posts','post_kudos',
                           'post_comments','notifications']
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

-- ------------------------------------------ notifications poussees

alter table public.push_subscriptions enable row level security;
-- Aucune policy : la table des abonnements ne se lit pas depuis le navigateur.
-- Un abonnement contient les cles de chiffrement d'un appareil, elles n'ont
-- aucune raison de circuler. Tout passe par les fonctions security definer.

grant execute on function public.save_push_subscription(uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.delete_push_subscription(text)  to anon, authenticated;
grant execute on function public.a_un_abonnement_push(uuid)      to anon, authenticated;
-- push_a_envoyer et push_echec ne servent qu'a la fonction Edge : leur retrait
-- et leur droit pour la cle de service sont traites plus haut.

-- Une notification inseree part aussitot vers la fonction Edge, qui se charge
-- de joindre les appareils. pg_net travaille en arriere plan : la transaction
-- qui a cree la notification n'attend pas le reseau.
create or replace function public.declenche_push() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://bdqbrdoorqcxutfojgze.supabase.co/functions/v1/envoyer-push',
    body := jsonb_build_object('notification_id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push
  after insert on public.notifications
  for each row execute function public.declenche_push();
