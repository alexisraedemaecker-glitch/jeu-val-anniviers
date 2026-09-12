-- =====================================================================
-- Fonctions serveur. Toute ecriture passe par ici, jamais par un insert
-- direct depuis le navigateur : les tables n'accordent aucun droit
-- d'ecriture au role public, et ces fonctions sont security definer.
-- Idempotent, peut etre rejoue sans danger.
-- =====================================================================

-- Recalcule l'ensemble des synergies debloquees, pour tout le monde.
-- Appelee apres chaque soumission et apres chaque suppression, ce qui garantit
-- un etat juste meme si l'organisateur retire une soumission en fin de journee.
create or replace function public.recompute_synergies()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with faits as (
    select distinct m.participant_id, s.challenge_id
    from public.submission_members m
    join public.submissions s on s.id = m.submission_id
  ),
  earned as (
    select f.participant_id, sy.id as synergy_id
    from (select distinct participant_id from faits) f
    cross join public.synergies sy
    where exists (select 1 from faits a
                   where a.participant_id = f.participant_id
                     and a.challenge_id = any (sy.triggers_a))
      and exists (select 1 from faits b
                   where b.participant_id = f.participant_id
                     and b.challenge_id = any (sy.triggers_b))
  )
  insert into public.synergy_unlocks (participant_id, synergy_id)
  select participant_id, synergy_id from earned
  on conflict (participant_id, synergy_id) do nothing;

  with faits as (
    select distinct m.participant_id, s.challenge_id
    from public.submission_members m
    join public.submissions s on s.id = m.submission_id
  ),
  earned as (
    select f.participant_id, sy.id as synergy_id
    from (select distinct participant_id from faits) f
    cross join public.synergies sy
    where exists (select 1 from faits a
                   where a.participant_id = f.participant_id
                     and a.challenge_id = any (sy.triggers_a))
      and exists (select 1 from faits b
                   where b.participant_id = f.participant_id
                     and b.challenge_id = any (sy.triggers_b))
  )
  delete from public.synergy_unlocks u
  where not exists (select 1 from earned e
                     where e.participant_id = u.participant_id
                       and e.synergy_id = u.synergy_id);
end;
$$;

-- Cree le profil ou retrouve celui qui existe deja, sans tenir compte de la
-- casse ni des espaces autour. Remplace toute inscription par mot de passe.
create or replace function public.ensure_participant(
  p_first text,
  p_last  text,
  p_vibe  text default null
)
returns public.participants
language plpgsql
security definer
set search_path = public
as $$
declare
  v  public.participants;
  f  text := btrim(coalesce(p_first, ''));
  l  text := btrim(coalesce(p_last, ''));
  vb text := nullif(btrim(coalesce(p_vibe, '')), '');
begin
  if f = '' or l = '' then
    raise exception 'Le prénom et le nom sont obligatoires';
  end if;
  if length(f) > 40 or length(l) > 40 then
    raise exception 'Prénom ou nom trop long';
  end if;
  if vb is not null and vb not in ('chill','culturel','culinaire','sportif') then
    vb := null;
  end if;

  select * into v from public.participants
   where lower(btrim(first_name)) = lower(f)
     and lower(btrim(last_name))  = lower(l);

  if found then
    if vb is not null and coalesce(v.vibe, '') <> vb then
      update public.participants set vibe = vb where id = v.id returning * into v;
    end if;
    return v;
  end if;

  insert into public.participants (first_name, last_name, vibe)
  values (f, l, vb)
  returning * into v;
  return v;
end;
$$;

-- Met a jour l'envie dominante du moment. Purement informatif.
create or replace function public.set_vibe(p_participant uuid, p_vibe text)
returns public.participants
language plpgsql
security definer
set search_path = public
as $$
declare
  v  public.participants;
  vb text := nullif(btrim(coalesce(p_vibe, '')), '');
begin
  if vb is not null and vb not in ('chill','culturel','culinaire','sportif') then
    raise exception 'Envie inconnue';
  end if;
  update public.participants set vibe = vb where id = p_participant returning * into v;
  if not found then
    raise exception 'Profil introuvable';
  end if;
  return v;
end;
$$;

-- Soumission d'un defi. Idempotente sur client_id : si le telephone renvoie la
-- meme soumission apres une coupure reseau, elle n'est jamais comptee deux fois.
-- La signature a change avec l'ajout de p_quiz_restarts, on retire donc
-- l'ancienne version pour eviter deux fonctions de meme nom.
drop function if exists public.submit_challenge(text, text, uuid, uuid[], text, text, int);

create or replace function public.submit_challenge(
  p_client_id     text,
  p_challenge_id  text,
  p_submitter     uuid,
  p_member_ids    uuid[] default null,
  p_photo_path    text default null,
  p_note          text default null,
  p_quiz_attempts int default 0,
  p_quiz_restarts int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub       public.submissions;
  v_challenge public.challenges;
  v_members   uuid[];
  v_before    text[];
  v_new       jsonb;
  v_gauge     numeric;
  v_index     int;
  v_path      text := nullif(btrim(coalesce(p_photo_path, '')), '');
  v_bloque    timestamptz;
  v_exclus    jsonb;
begin
  if coalesce(btrim(p_client_id), '') = '' then
    raise exception 'Identifiant de soumission manquant';
  end if;

  -- Rejeu d'une soumission deja enregistree : on renvoie l'etat existant.
  select * into v_sub from public.submissions where client_id = p_client_id;
  if found then
    select g.gauge_points, g.repeat_index into v_gauge, v_index
      from public.v_submission_gauge g where g.submission_id = v_sub.id;
    return jsonb_build_object(
      'submission_id', v_sub.id,
      'duplicate',     true,
      'gauge_points',  coalesce(v_gauge, 0),
      'repeat_index',  coalesce(v_index, 1),
      'new_synergies', '[]'::jsonb
    );
  end if;

  select * into v_challenge from public.challenges where id = p_challenge_id;
  if not found then
    raise exception 'Défi inconnu : %', p_challenge_id;
  end if;

  if not exists (select 1 from public.participants where id = p_submitter) then
    raise exception 'Profil introuvable';
  end if;

  -- Penalite en cours apres un quiz rate : la soumission est refusee.
  -- Le controle est ici, cote serveur, donc recharger l'application ne sert a rien.
  v_bloque := public.lockout_until(p_submitter, p_challenge_id);
  if v_bloque is not null then
    raise exception 'Défi en attente jusqu''à % (ENATTENTE %)',
      to_char(v_bloque at time zone 'Europe/Zurich', 'HH24:MI'),
      to_char(v_bloque, 'YYYY-MM-DD"T"HH24:MI:SSOF');
  end if;

  -- Le groupe du moment contient toujours la personne qui soumet. Les membres
  -- encore sous penalite sur ce defi en sont ecartes : ils ne peuvent pas en
  -- profiter avant la fin de leur attente.
  select coalesce(array_agg(distinct x), array[]::uuid[]) into v_members
  from unnest(coalesce(p_member_ids, array[]::uuid[]) || array[p_submitter]) as t(x)
  where x is not null
    and exists (select 1 from public.participants pp where pp.id = x)
    and (x = p_submitter or public.lockout_until(x, p_challenge_id) is null);

  select coalesce(jsonb_agg(jsonb_build_object(
           'participant_id', x,
           'until', public.lockout_until(x, p_challenge_id))), '[]'::jsonb)
    into v_exclus
  from unnest(coalesce(p_member_ids, array[]::uuid[])) as t(x)
  where x is not null
    and x <> p_submitter
    and public.lockout_until(x, p_challenge_id) is not null;

  -- Chemin de photo : on refuse tout ce qui sort de la convention de nommage.
  if v_path is not null and v_path !~ '^[0-9a-zA-Z][0-9a-zA-Z/_.-]{0,200}$' then
    raise exception 'Chemin de photo invalide';
  end if;
  if v_path is not null and v_path like '%..%' then
    raise exception 'Chemin de photo invalide';
  end if;

  select coalesce(array_agg(participant_id::text || '|' || synergy_id), array[]::text[])
    into v_before
    from public.synergy_unlocks where participant_id = any (v_members);

  insert into public.submissions (client_id, challenge_id, submitter_id, photo_path,
                                  note, quiz_attempts, quiz_restarts)
  values (p_client_id, p_challenge_id, p_submitter, v_path,
          left(nullif(btrim(coalesce(p_note, '')), ''), 2000),
          greatest(0, least(99, coalesce(p_quiz_attempts, 0))),
          greatest(0, least(99, coalesce(p_quiz_restarts, 0))))
  returning * into v_sub;

  insert into public.submission_members (submission_id, participant_id)
  select v_sub.id, x from unnest(v_members) as t(x)
  on conflict do nothing;

  perform public.recompute_synergies();

  select coalesce(jsonb_agg(jsonb_build_object(
           'participant_id', u.participant_id,
           'synergy_id',     u.synergy_id)), '[]'::jsonb)
    into v_new
    from public.synergy_unlocks u
   where u.participant_id = any (v_members)
     and not ((u.participant_id::text || '|' || u.synergy_id) = any (v_before));

  select g.gauge_points, g.repeat_index into v_gauge, v_index
    from public.v_submission_gauge g where g.submission_id = v_sub.id;

  return jsonb_build_object(
    'submission_id', v_sub.id,
    'duplicate',     false,
    'full_points',   v_challenge.points,
    'pillar',        v_challenge.pillar,
    'gauge_points',  coalesce(v_gauge, 0),
    'repeat_index',  coalesce(v_index, 1),
    'members',       to_jsonb(v_members),
    'excluded',      v_exclus,
    'new_synergies', v_new
  );
end;
$$;

-- Verification du code organisateur, cote serveur uniquement. Le code lui meme
-- vit dans app_settings, table sans aucune policy donc illisible du navigateur.
create or replace function public.check_organizer(p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v text;
begin
  select value into v from public.app_settings where key = 'organizer_pin';
  if not found then
    return false;
  end if;
  return btrim(coalesce(p_pin, '')) = v;
end;
$$;

-- Suppression d'une soumission par l'organisateur. Retire aussi la photo du
-- stockage et recalcule les synergies. Les jauges se retassent d'elles memes
-- puisque le rendement degressif est calcule a la lecture.
create or replace function public.delete_submission(p_submission uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_path text;
begin
  if not public.check_organizer(p_pin) then
    raise exception 'Code organisateur incorrect';
  end if;

  select photo_path into v_path from public.submissions where id = p_submission;
  if not found then
    raise exception 'Soumission introuvable';
  end if;

  delete from public.submissions where id = p_submission;
  perform public.recompute_synergies();

  -- Supabase interdit la suppression directe dans les tables de stockage, il
  -- faut passer par son API. On renvoie donc le chemin : la photo est desormais
  -- orpheline, et la policy "preuves menage" autorise a la retirer.
  return jsonb_build_object('deleted', true, 'photo_path', v_path);
end;
$$;

-- Vrai uniquement si plus aucune soumission ne reference cette photo.
-- Sert de garde a la policy de suppression du stockage : on ne peut retirer
-- qu'une photo devenue orpheline, donc uniquement apres qu'un organisateur a
-- supprime la soumission correspondante avec son code.
create or replace function public.photo_est_orpheline(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.submissions where photo_path = p_name
  );
$$;

-- =====================================================================
-- Penalite apres un quiz rate
-- =====================================================================

-- Duree de la penalite, modifiable sans redeploiement de l'application.
create or replace function public.lockout_minutes()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(btrim(value), '')::int from public.app_settings where key = 'quiz_lockout_minutes'),
    30
  );
$$;

-- Fin de penalite pour une personne sur un defi, ou null si elle est libre.
create or replace function public.lockout_until(p_participant uuid, p_challenge text)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select max(until) from public.quiz_lockouts
   where participant_id = p_participant
     and challenge_id = p_challenge
     and until > now();
$$;

-- Enregistre un quiz rate. La penalite frappe toute l'equipe presente au
-- moment du ratage, pas seulement la personne qui a clique.
-- Idempotente sur client_id, pour survivre a une file d'attente hors ligne.
create or replace function public.report_quiz_failure(
  p_client_id    text,
  p_challenge_id text,
  p_participant  uuid,
  p_member_ids   uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_members uuid[];
  v_minutes int := public.lockout_minutes();
  v_until   timestamptz;
  v_deja    timestamptz;
begin
  if coalesce(btrim(p_client_id), '') = '' then
    raise exception 'Identifiant manquant';
  end if;
  if not exists (select 1 from public.challenges where id = p_challenge_id) then
    raise exception 'Défi inconnu : %', p_challenge_id;
  end if;
  if not exists (select 1 from public.participants where id = p_participant) then
    raise exception 'Profil introuvable';
  end if;

  -- Rejeu d'un signalement deja enregistre : on renvoie la penalite existante.
  select max(until) into v_deja from public.quiz_lockouts where client_id = p_client_id;
  if v_deja is not null then
    return jsonb_build_object('until', v_deja, 'minutes', v_minutes, 'duplicate', true);
  end if;

  select coalesce(array_agg(distinct x), array[]::uuid[]) into v_members
  from unnest(coalesce(p_member_ids, array[]::uuid[]) || array[p_participant]) as t(x)
  where x is not null
    and exists (select 1 from public.participants pp where pp.id = x);

  v_until := now() + make_interval(mins => v_minutes);

  insert into public.quiz_lockouts (client_id, participant_id, challenge_id, triggered_by, until)
  select p_client_id, x, p_challenge_id, p_participant, v_until
  from unnest(v_members) as t(x)
  on conflict (client_id, participant_id) do nothing;

  return jsonb_build_object(
    'until',     v_until,
    'minutes',   v_minutes,
    'members',   to_jsonb(v_members),
    'duplicate', false
  );
end;
$$;

-- Etat complet du jeu en un seul appel reseau. Utile en montagne : une requete
-- plutot que six, et tout ce dont l'app a besoin pour se redessiner.
create or replace function public.game_state()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'gauges',      (select coalesce(jsonb_agg(to_jsonb(g) order by g.sort_order), '[]'::jsonb)
                      from public.v_pillar_gauges g),
    'collective',  (select to_jsonb(c) from public.v_collective_status c),
    'scores',      (select coalesce(jsonb_agg(to_jsonb(s) order by s.score desc, s.first_name), '[]'::jsonb)
                      from public.v_personal_scores s),
    'stats',       (select coalesce(jsonb_object_agg(st.challenge_id, st.passages), '{}'::jsonb)
                      from public.v_challenge_stats st),
    'unlocks',     (select coalesce(jsonb_agg(jsonb_build_object(
                              'participant_id', u.participant_id,
                              'synergy_id',     u.synergy_id,
                              'created_at',     u.created_at)), '[]'::jsonb)
                      from public.synergy_unlocks u),
    -- Pour chaque personne, la liste des defis qu'elle a personnellement valides.
    -- Sert a afficher les badges deja fait et l'avancement vers les synergies.
    'done',        (select coalesce(jsonb_object_agg(d.participant_id, d.cids), '{}'::jsonb)
                      from (select m.participant_id::text as participant_id,
                                   array_agg(distinct s.challenge_id) as cids
                              from public.submission_members m
                              join public.submissions s on s.id = m.submission_id
                             group by m.participant_id) d),
    -- Penalites encore actives, pour que chaque appareil sache qui attend.
    'lockouts',    (select coalesce(jsonb_agg(jsonb_build_object(
                              'participant_id', l.participant_id,
                              'challenge_id',   l.challenge_id,
                              'until',          l.until)), '[]'::jsonb)
                      from public.quiz_lockouts l where l.until > now()),
    'settings',    jsonb_build_object('lockout_minutes', public.lockout_minutes()),
    'server_time', now()
  );
$$;

-- =====================================================================
-- Administration. Toutes ces fonctions exigent le code organisateur.
-- =====================================================================

create or replace function public.admin_clear_lockouts(
  p_pin         text,
  p_participant uuid default null,
  p_challenge   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  if not public.check_organizer(p_pin) then
    raise exception 'Code organisateur incorrect';
  end if;
  delete from public.quiz_lockouts
   where until > now()
     and (p_participant is null or participant_id = p_participant)
     and (p_challenge is null or challenge_id = p_challenge);
  get diagnostics v_n = row_count;
  return jsonb_build_object('levees', v_n);
end;
$$;

create or replace function public.admin_rename_participant(
  p_pin   text,
  p_id    uuid,
  p_first text,
  p_last  text
)
returns public.participants
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.participants;
  f text := btrim(coalesce(p_first, ''));
  l text := btrim(coalesce(p_last, ''));
begin
  if not public.check_organizer(p_pin) then
    raise exception 'Code organisateur incorrect';
  end if;
  if f = '' or l = '' then
    raise exception 'Le prénom et le nom sont obligatoires';
  end if;
  if exists (select 1 from public.participants
              where id <> p_id
                and lower(btrim(first_name)) = lower(f)
                and lower(btrim(last_name)) = lower(l)) then
    raise exception 'Ce prénom et ce nom existent déjà';
  end if;
  update public.participants set first_name = f, last_name = l
   where id = p_id returning * into v;
  if not found then
    raise exception 'Profil introuvable';
  end if;
  return v;
end;
$$;

-- Supprime un profil et tout ce qui en depend. Renvoie les photos devenues
-- orphelines, que l'application retire ensuite par l'API de stockage.
create or replace function public.admin_delete_participant(p_pin text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_photos text[];
begin
  if not public.check_organizer(p_pin) then
    raise exception 'Code organisateur incorrect';
  end if;
  select coalesce(array_agg(photo_path), array[]::text[]) into v_photos
    from public.submissions where submitter_id = p_id and photo_path is not null;
  delete from public.participants where id = p_id;
  if not found then
    raise exception 'Profil introuvable';
  end if;
  perform public.recompute_synergies();
  return jsonb_build_object('deleted', true, 'photos', to_jsonb(v_photos));
end;
$$;

-- Remise a zero complete du jeu. Le catalogue, les synergies et le code
-- organisateur ne sont pas touches.
create or replace function public.admin_reset_game(p_pin text, p_confirmation text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_photos text[];
  v_joueurs int;
  v_soumissions int;
begin
  if not public.check_organizer(p_pin) then
    raise exception 'Code organisateur incorrect';
  end if;
  if upper(btrim(coalesce(p_confirmation, ''))) <> 'REMISE A ZERO' then
    raise exception 'Confirmation incorrecte';
  end if;

  select coalesce(array_agg(photo_path), array[]::text[]) into v_photos
    from public.submissions where photo_path is not null;
  select count(*) into v_joueurs from public.participants;
  select count(*) into v_soumissions from public.submissions;

  delete from public.quiz_lockouts;
  delete from public.participants;

  return jsonb_build_object(
    'joueurs_supprimes',     v_joueurs,
    'soumissions_supprimees', v_soumissions,
    'photos',                to_jsonb(v_photos)
  );
end;
$$;

create or replace function public.admin_set_lockout_minutes(p_pin text, p_minutes int)
returns int
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_organizer(p_pin) then
    raise exception 'Code organisateur incorrect';
  end if;
  if p_minutes is null or p_minutes < 0 or p_minutes > 720 then
    raise exception 'Durée hors limites, entre 0 et 720 minutes';
  end if;
  insert into public.app_settings (key, value) values ('quiz_lockout_minutes', p_minutes::text)
    on conflict (key) do update set value = excluded.value;
  return p_minutes;
end;
$$;
