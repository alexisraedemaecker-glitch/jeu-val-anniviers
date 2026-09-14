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

-- Chemin de fichier accepte : lettres, chiffres et separateurs simples.
create or replace function public.chemin_valide(p text)
returns boolean
language sql
immutable
as $$
  select p is null
      or (p ~ '^[0-9a-zA-Z][0-9a-zA-Z/_.-]{0,200}$' and p not like '%..%');
$$;

-- Cree le profil ou retrouve celui qui existe deja, sans tenir compte de la
-- casse ni des espaces autour. Remplace toute inscription par mot de passe.
-- La signature a change avec l'ajout du portrait, on retire donc l'ancienne.
drop function if exists public.ensure_participant(text, text, text);
drop function if exists public.ensure_participant(text, text, text, text);

-- Le code protege le profil des le premier jour : sans lui, n'importe qui
-- pourrait jouer sous le nom d'un autre depuis son propre telephone. Un profil
-- cree avant cette regle se voit demander son code la premiere fois qu'il
-- revient, et c'est ce code la qui est pose.
create or replace function public.ensure_participant(
  p_first text,
  p_last  text,
  p_vibe  text default null,
  p_photo text default null,
  p_code  text default null
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
  ph text := nullif(btrim(coalesce(p_photo, '')), '');
begin
  if not public.chemin_valide(ph) then
    raise exception 'Chemin de portrait invalide';
  end if;
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
    if public.a_un_code(v.id) then
      if not public.verifie_code(v.id, p_code) then
        raise exception 'Code incorrect pour ce profil';
      end if;
    else
      -- Profil existant sans code : on pose celui qui vient d'etre choisi.
      perform public.set_code(v.id, p_code);
    end if;
    -- On complete sans jamais ecraser un portrait deja en place par du vide.
    if (vb is not null and coalesce(v.vibe, '') <> vb)
       or (ph is not null and coalesce(v.photo_path, '') <> ph) then
      update public.participants
         set vibe = coalesce(vb, vibe),
             photo_path = coalesce(ph, photo_path)
       where id = v.id
      returning * into v;
    end if;
    return v;
  end if;

  if not public.code_valide(p_code) then
    raise exception 'Choisissez un code d''au moins quatre caractères';
  end if;
  insert into public.participants (first_name, last_name, vibe, photo_path)
  values (f, l, vb, ph)
  returning * into v;
  perform public.set_code(v.id, p_code);
  return v;
end;
$$;

-- Remplace le portrait d'un profil existant.
create or replace function public.set_photo(p_participant uuid, p_photo text)
returns public.participants
language plpgsql
security definer
set search_path = public
as $$
declare
  v  public.participants;
  ph text := nullif(btrim(coalesce(p_photo, '')), '');
begin
  if ph is null then
    raise exception 'Portrait manquant';
  end if;
  if not public.chemin_valide(ph) then
    raise exception 'Chemin de portrait invalide';
  end if;
  update public.participants set photo_path = ph where id = p_participant returning * into v;
  if not found then
    raise exception 'Profil introuvable';
  end if;
  return v;
end;
$$;

-- Vrai si aucun profil ne se sert de ce portrait. Sert de garde a la policy
-- de menage du bucket des portraits.
create or replace function public.portrait_est_orphelin(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.participants where photo_path = p_name);
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

  -- Le fil raconte la journee tout seul : chaque defi valide devient une
  -- publication, que le groupe peut commenter et applaudir.
  insert into public.posts (author_id, submission_id, created_at)
  values (p_submitter, v_sub.id, v_sub.created_at)
  on conflict (submission_id) do nothing;

  -- Les autres personnes du groupe du moment sont prevenues : un defi vient
  -- d'etre valide en leur nom, meme si elles n'ont pas tenu le telephone.
  perform public.notifier(
    (select coalesce(array_agg(x), array[]::uuid[]) from unnest(v_members) as t(x)),
    'defi',
    (select id from public.posts where submission_id = v_sub.id),
    null,
    p_submitter);

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
declare
  v_photos text[];
  v_portrait text;
begin
  if not public.check_organizer(p_pin) then
    raise exception 'Code organisateur incorrect';
  end if;
  select coalesce(array_agg(photo_path), array[]::text[]) into v_photos
    from (select photo_path from public.submissions
           where submitter_id = p_id and photo_path is not null
          union all
          select photo_path from public.posts
           where author_id = p_id and photo_path is not null) t;
  select coalesce(photo_path, '') into v_portrait from public.participants where id = p_id;
  delete from public.participants where id = p_id;
  if not found then
    raise exception 'Profil introuvable';
  end if;
  perform public.recompute_synergies();
  return jsonb_build_object('deleted', true, 'photos', to_jsonb(v_photos),
                            'portrait', nullif(v_portrait, ''));
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
  v_portraits text[];
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
    from (select photo_path from public.submissions where photo_path is not null
          union all
          select photo_path from public.posts where photo_path is not null) t;
  select coalesce(array_agg(photo_path), array[]::text[]) into v_portraits
    from public.participants where photo_path is not null;
  select count(*) into v_joueurs from public.participants;
  select count(*) into v_soumissions from public.submissions;

  delete from public.quiz_lockouts;
  delete from public.participants;

  return jsonb_build_object(
    'joueurs_supprimes',     v_joueurs,
    'soumissions_supprimees', v_soumissions,
    'photos',                to_jsonb(v_photos),
    'portraits',             to_jsonb(v_portraits)
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

-- =====================================================================
-- Mot de passe des profils
-- =====================================================================

-- Le mot de passe n'est jamais stocke en clair. pgcrypto calcule une empreinte
-- bcrypt avec un sel propre a chaque profil, et la verification recalcule
-- l'empreinte du mot de passe presente avec le meme sel.
create or replace function public.code_valide(p_code text) returns boolean
language sql immutable as $$
  select p_code is not null and length(btrim(p_code)) >= 4 and length(p_code) <= 72;
$$;

create or replace function public.a_un_code(p_participant uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.participant_secrets s where s.participant_id = p_participant);
$$;

-- Pose le code d'un profil qui n'en a pas encore. Ne remplace jamais un code
-- existant : seul l'organisateur peut le faire, avec son propre code.
create or replace function public.set_code(p_participant uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.code_valide(p_code) then
    raise exception 'Le code doit faire au moins quatre caractères';
  end if;
  if exists (select 1 from public.participant_secrets where participant_id = p_participant) then
    raise exception 'Ce profil a déjà un code';
  end if;
  insert into public.participant_secrets (participant_id, password_hash)
  values (p_participant, extensions.crypt(p_code, extensions.gen_salt('bf')));
  return true;
end;
$$;

create or replace function public.verifie_code(p_participant uuid, p_code text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.participant_secrets s
     where s.participant_id = p_participant
       and s.password_hash = extensions.crypt(coalesce(p_code, ''), s.password_hash)
  );
$$;

-- =====================================================================
-- Fil social : publications, cornes, commentaires, notifications
-- =====================================================================

-- Ne previent jamais quelqu'un de sa propre action, et ne pose qu'une seule
-- notification par personne et par evenement.
create or replace function public.notifier(
  p_destinataires uuid[], p_kind text, p_post uuid, p_comment uuid, p_actor uuid
) returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  insert into public.notifications (participant_id, kind, post_id, comment_id, actor_id)
  select distinct d, p_kind, p_post, p_comment, p_actor
    from unnest(coalesce(p_destinataires, array[]::uuid[])) as t(d)
   where d is not null
     and d <> p_actor
     and exists (select 1 from public.participants pa where pa.id = d)
     and not exists (
       select 1 from public.notifications n
        where n.participant_id = d
          and n.kind = p_kind
          and n.actor_id = p_actor
          and coalesce(n.post_id::text, '') = coalesce(p_post::text, '')
          and coalesce(n.comment_id::text, '') = coalesce(p_comment::text, '')
     );
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

create or replace function public.add_post(
  p_client_id text,
  p_author    uuid,
  p_texte     text default null,
  p_photo     text default null,
  p_mentions  uuid[] default '{}'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_post   public.posts;
  v_texte  text := left(nullif(btrim(coalesce(p_texte, '')), ''), 2000);
  v_ment   uuid[] := coalesce(p_mentions, array[]::uuid[]);
begin
  if not exists (select 1 from public.participants where id = p_author) then
    raise exception 'Profil inconnu';
  end if;
  if v_texte is null and p_photo is null then
    raise exception 'Un message vide ne sert à rien';
  end if;
  if not public.chemin_valide(p_photo) then
    raise exception 'Chemin de photo invalide';
  end if;

  -- Renvoi apres une coupure reseau : on ne publie pas deux fois.
  select * into v_post from public.posts where client_id = p_client_id;
  if found then
    return jsonb_build_object('post_id', v_post.id, 'duplicate', true);
  end if;

  insert into public.posts (client_id, author_id, texte, photo_path, mentions)
  values (p_client_id, p_author, v_texte, nullif(btrim(coalesce(p_photo, '')), ''), v_ment)
  returning * into v_post;

  perform public.notifier(v_ment, 'mention', v_post.id, null, p_author);
  return jsonb_build_object('post_id', v_post.id, 'duplicate', false);
end;
$$;

create or replace function public.add_comment(
  p_client_id text,
  p_author    uuid,
  p_post      uuid,
  p_texte     text,
  p_mentions  uuid[] default '{}'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_com    public.post_comments;
  v_post   public.posts;
  v_texte  text := left(nullif(btrim(coalesce(p_texte, '')), ''), 1000);
  v_ment   uuid[] := coalesce(p_mentions, array[]::uuid[]);
  v_autres uuid[];
begin
  if v_texte is null then
    raise exception 'Le commentaire est vide';
  end if;
  select * into v_post from public.posts where id = p_post;
  if not found then
    raise exception 'Publication introuvable';
  end if;

  select * into v_com from public.post_comments where client_id = p_client_id;
  if found then
    return jsonb_build_object('comment_id', v_com.id, 'duplicate', true);
  end if;

  insert into public.post_comments (client_id, post_id, author_id, texte, mentions)
  values (p_client_id, p_post, p_author, v_texte, v_ment)
  returning * into v_com;

  -- Une seule notification par personne et par commentaire, la plus parlante :
  -- etre nomme passe avant le fait d'etre l'auteur, qui passe avant le simple
  -- fait d'avoir deja commente.
  perform public.notifier(v_ment, 'mention', p_post, v_com.id, p_author);
  perform public.notifier(
    (select coalesce(array_agg(x), array[]::uuid[]) from unnest(array[v_post.author_id]) as t(x)
      where not (x = any (v_ment))),
    'commentaire', p_post, v_com.id, p_author);
  select coalesce(array_agg(distinct c.author_id), array[]::uuid[]) into v_autres
    from public.post_comments c
   where c.post_id = p_post
     and c.id <> v_com.id
     and c.author_id <> v_post.author_id
     and not (c.author_id = any (v_ment));
  perform public.notifier(v_autres, 'reponse', p_post, v_com.id, p_author);

  return jsonb_build_object('comment_id', v_com.id, 'duplicate', false);
end;
$$;

-- Une corne de bouquetin s'ajoute et se retire. On ne notifie qu'a la pose.
create or replace function public.toggle_kudo(p_participant uuid, p_post uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_post public.posts;
  v_pose boolean;
begin
  select * into v_post from public.posts where id = p_post;
  if not found then
    raise exception 'Publication introuvable';
  end if;
  if exists (select 1 from public.post_kudos where post_id = p_post and participant_id = p_participant) then
    delete from public.post_kudos where post_id = p_post and participant_id = p_participant;
    v_pose := false;
  else
    insert into public.post_kudos (post_id, participant_id) values (p_post, p_participant);
    v_pose := true;
    perform public.notifier(array[v_post.author_id], 'kudo', p_post, null, p_participant);
  end if;
  return jsonb_build_object(
    'pose', v_pose,
    'total', (select count(*) from public.post_kudos where post_id = p_post)
  );
end;
$$;

create or replace function public.mark_notifications_read(p_participant uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  update public.notifications set read_at = now()
   where participant_id = p_participant and read_at is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Une publication peut etre retiree par son auteur, ou par un organisateur
-- muni du code. Les publications de defi suivent leur soumission et ne se
-- suppriment pas ici.
create or replace function public.delete_post(p_post uuid, p_participant uuid, p_pin text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_post public.posts;
begin
  select * into v_post from public.posts where id = p_post;
  if not found then
    return jsonb_build_object('deleted', false);
  end if;
  if v_post.submission_id is not null then
    raise exception 'Cette publication suit un défi validé, elle se retire depuis la vue organisateur';
  end if;
  if v_post.author_id <> coalesce(p_participant, '00000000-0000-0000-0000-000000000000'::uuid)
     and not public.check_organizer(p_pin) then
    raise exception 'Seul son auteur peut retirer cette publication';
  end if;
  delete from public.posts where id = p_post;
  return jsonb_build_object('deleted', true, 'photo_path', v_post.photo_path);
end;
$$;

-- Tout ce qu'il faut au fil et a l'album, en un appel. Les commentaires sont
-- rendus avec leur publication, et les notifications ne concernent que la
-- personne qui demande.
create or replace function public.feed_state(p_participant uuid default null)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'posts', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
        from (
          select v.*,
                 coalesce((
                   select jsonb_agg(jsonb_build_object(
                            'id', c.id,
                            'author_id', c.author_id,
                            'author_name', (a.first_name || ' ' || a.last_name),
                            'author_photo', a.photo_path,
                            'texte', c.texte,
                            'mentions', c.mentions,
                            'created_at', c.created_at) order by c.created_at)
                     from public.post_comments c
                     join public.participants a on a.id = c.author_id
                    where c.post_id = v.id), '[]'::jsonb) as commentaires
            from public.v_posts v
        ) x
    ),
    'notifications', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', n.id,
               'kind', n.kind,
               'post_id', n.post_id,
               'comment_id', n.comment_id,
               'actor_id', n.actor_id,
               'actor_name', (a.first_name || ' ' || a.last_name),
               'actor_photo', a.photo_path,
               'created_at', n.created_at,
               'read_at', n.read_at) order by n.created_at desc), '[]'::jsonb)
        from public.notifications n
        left join public.participants a on a.id = n.actor_id
       where p_participant is not null and n.participant_id = p_participant
         and n.created_at > now() - interval '3 days'
    ),
    'server_time', now()
  );
$$;

create or replace function public.admin_reset_code(p_pin text, p_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.check_organizer(p_pin) then
    raise exception 'Code organisateur incorrect';
  end if;
  if not public.code_valide(p_code) then
    raise exception 'Le code doit faire au moins quatre caractères';
  end if;
  insert into public.participant_secrets (participant_id, password_hash)
  values (p_id, extensions.crypt(p_code, extensions.gen_salt('bf')))
  on conflict (participant_id) do update
    set password_hash = excluded.password_hash, updated_at = now();
  return true;
end;
$$;

-- Une photo de publication libre se retire comme les autres : seulement quand
-- plus aucune ligne ne la reclame.
create or replace function public.photo_post_est_orpheline(p_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.posts p where p.photo_path = p_name);
$$;

-- =====================================================================
-- Notifications poussees
-- =====================================================================

-- Un appareil s'abonne. La meme personne peut en avoir plusieurs, et un
-- appareil qui change de main est reattribue plutot que duplique.
create or replace function public.save_push_subscription(
  p_participant uuid,
  p_endpoint    text,
  p_p256dh      text,
  p_auth        text,
  p_agent       text default null
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_endpoint is null or btrim(p_endpoint) = '' then
    raise exception 'Abonnement incomplet';
  end if;
  if not exists (select 1 from public.participants where id = p_participant) then
    raise exception 'Profil inconnu';
  end if;
  insert into public.push_subscriptions (endpoint, participant_id, p256dh, auth, user_agent)
  values (btrim(p_endpoint), p_participant, p_p256dh, p_auth, left(coalesce(p_agent, ''), 300))
  on conflict (endpoint) do update
    set participant_id = excluded.participant_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        last_seen = now(),
        echecs = 0;
  return true;
end;
$$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns boolean
language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
  select true;
$$;

create or replace function public.a_un_abonnement_push(p_participant uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.push_subscriptions where participant_id = p_participant);
$$;

-- Tout ce qu'il faut pour rediger et envoyer une notification, en une ligne.
-- Appelee par la fonction Edge, qui ne voit jamais le reste de la base.
create or replace function public.push_a_envoyer(p_notification uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'notification_id', n.id,
    'kind',            n.kind,
    'acteur',          coalesce(a.first_name || ' ' || a.last_name, 'Quelqu''un'),
    'defi',            c.name,
    'abonnements',     coalesce((
      select jsonb_agg(jsonb_build_object(
               'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
        from public.push_subscriptions s
       where s.participant_id = n.participant_id), '[]'::jsonb)
  )
  from public.notifications n
  left join public.participants a on a.id = n.actor_id
  left join public.posts p on p.id = n.post_id
  left join public.submissions sub on sub.id = p.submission_id
  left join public.challenges c on c.id = sub.challenge_id
 where n.id = p_notification;
$$;

-- Un abonnement mort, par exemple une application desinstallee, est retire
-- apres quelques echecs plutot qu'a la premiere erreur reseau.
create or replace function public.push_echec(p_endpoint text, p_definitif boolean default false)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_definitif then
    delete from public.push_subscriptions where endpoint = p_endpoint;
  else
    update public.push_subscriptions set echecs = echecs + 1 where endpoint = p_endpoint;
    delete from public.push_subscriptions where endpoint = p_endpoint and echecs >= 5;
  end if;
  return true;
end;
$$;
