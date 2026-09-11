-- =====================================================================
-- Le Val d'Anniviers en 2056 : schema de base
-- Idempotent, peut etre rejoue sans danger.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table if not exists public.pillars (
  id          text primary key,
  name        text not null,
  short       text not null,
  max_points  int  not null default 200,
  sort_order  int  not null,
  color       text,
  icon        text,
  blurb       text
);

create table if not exists public.challenges (
  id              text primary key,
  pillar          text not null references public.pillars(id),
  name            text not null,
  style           text not null check (style in ('chill','culturel','culinaire','sportif')),
  tier            text not null check (tier in ('decouverte','experience','mission')),
  points          int  not null check (points > 0),
  location_kind   text not null check (location_kind in ('libre','typee','precise')),
  location_detail text,
  proof           text not null check (proof in ('photo','quiz','photo_quiz')),
  sort_order      int  not null
);

create table if not exists public.synergies (
  id             text primary key,
  name           text not null,
  pillar_a       text not null references public.pillars(id),
  pillar_b       text not null references public.pillars(id),
  triggers_a     text[] not null,
  triggers_b     text[] not null,
  personal_bonus int not null default 10,
  gauge_bonus    int not null default 5,
  sort_order     int not null
);

create table if not exists public.participants (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name  text not null,
  vibe       text check (vibe in ('chill','culturel','culinaire','sportif')),
  created_at timestamptz not null default now()
);
create unique index if not exists participants_name_uniq
  on public.participants (lower(btrim(first_name)), lower(btrim(last_name)));

create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  client_id     text not null unique,               -- cle d'idempotence generee sur l'appareil
  challenge_id  text not null references public.challenges(id),
  submitter_id  uuid not null references public.participants(id) on delete cascade,
  photo_path    text,
  note          text,
  quiz_attempts int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists submissions_challenge_idx on public.submissions (challenge_id, created_at, id);
create index if not exists submissions_created_idx   on public.submissions (created_at desc);

create table if not exists public.submission_members (
  submission_id  uuid not null references public.submissions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  primary key (submission_id, participant_id)
);
create index if not exists submission_members_participant_idx on public.submission_members (participant_id);

create table if not exists public.synergy_unlocks (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  synergy_id     text not null references public.synergies(id),
  created_at     timestamptz not null default now(),
  unique (participant_id, synergy_id)
);

-- Reglages prives. RLS active sans aucune policy : inaccessible depuis le navigateur.
create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);

-- ------------------------------------------------------------------ vues

-- Rendement degressif : pour un meme defi, la 1re validation de la journee
-- vaut 100 pourcent des points a la jauge, la 2e 50, la 3e 25, etc.
-- Calcule a la lecture, donc une suppression par l'organisateur retasse
-- automatiquement la suite.
create or replace view public.v_submission_gauge as
select s.id            as submission_id,
       s.challenge_id,
       c.pillar,
       c.points        as full_points,
       s.created_at,
       row_number() over (partition by s.challenge_id order by s.created_at, s.id) as repeat_index,
       round(
         (c.points::numeric / power(2::numeric, row_number() over (partition by s.challenge_id order by s.created_at, s.id) - 1))
       , 2) as gauge_points
from public.submissions s
join public.challenges c on c.id = s.challenge_id;

-- Bonus de jauge apporte par les synergies : 5 points sur chacun des deux piliers.
create or replace view public.v_synergy_gauge as
select sy.pillar_a as pillar, sy.gauge_bonus::numeric as gauge_points
  from public.synergy_unlocks u join public.synergies sy on sy.id = u.synergy_id
union all
select sy.pillar_b as pillar, sy.gauge_bonus::numeric as gauge_points
  from public.synergy_unlocks u join public.synergies sy on sy.id = u.synergy_id;

-- Les cinq jauges collectives, plafonnees a leur maximum.
create or replace view public.v_pillar_gauges as
with defis as (
  select pillar, sum(gauge_points) as pts from public.v_submission_gauge group by pillar
),
bonus as (
  select pillar, sum(gauge_points) as pts from public.v_synergy_gauge group by pillar
)
select p.id                       as pillar,
       p.name,
       p.short,
       p.max_points,
       p.sort_order,
       round(coalesce(d.pts, 0))::int                                as points_defis,
       round(coalesce(b.pts, 0))::int                                as points_synergies,
       least(p.max_points, round(coalesce(d.pts,0) + coalesce(b.pts,0))::int) as points,
       round(coalesce(d.pts,0) + coalesce(b.pts,0))::int             as points_bruts
from public.pillars p
left join defis d on d.pillar = p.id
left join bonus b on b.pillar = p.id
order by p.sort_order;

-- Score individuel. Un defi ne rapporte ses points qu'une seule fois par
-- personne, meme si elle le refait avec un autre groupe du moment.
-- Le rendement degressif n'affecte jamais le score personnel.
create or replace view public.v_personal_scores as
with faits as (
  select distinct m.participant_id, c.id as challenge_id, c.points
  from public.submission_members m
  join public.submissions s on s.id = m.submission_id
  join public.challenges  c on c.id = s.challenge_id
),
defis as (
  select participant_id, sum(points)::int as pts, count(*)::int as nb
  from faits group by participant_id
),
bonus as (
  select u.participant_id, sum(sy.personal_bonus)::int as pts, count(*)::int as nb
  from public.synergy_unlocks u join public.synergies sy on sy.id = u.synergy_id
  group by u.participant_id
)
select p.id,
       p.first_name,
       p.last_name,
       p.vibe,
       p.created_at,
       coalesce(d.pts,0) + coalesce(b.pts,0) as score,
       coalesce(d.pts,0)                     as score_defis,
       coalesce(b.pts,0)                     as score_synergies,
       coalesce(d.nb,0)                      as defis_faits,
       coalesce(b.nb,0)                      as synergies_debloquees
from public.participants p
left join defis d on d.participant_id = p.id
left join bonus b on b.participant_id = p.id;

-- Avancement collectif : seuil global 700 sur 1000 et plancher de 40 par pilier.
create or replace view public.v_collective_status as
select sum(points)::int                         as total,
       sum(max_points)::int                     as total_max,
       min(points)::int                         as pilier_le_plus_bas,
       count(*) filter (where points < 40)::int  as piliers_sous_plancher,
       (sum(points) >= 700 and min(points) >= 40) as objectif_atteint
from public.v_pillar_gauges;

-- Nombre de passages par defi, pour l'affichage et la vue organisateur.
create or replace view public.v_challenge_stats as
select c.id as challenge_id,
       count(s.id)::int as passages,
       round(coalesce(sum(g.gauge_points), 0))::int as total_jauge
from public.challenges c
left join public.submissions s      on s.challenge_id = c.id
left join public.v_submission_gauge g on g.submission_id = s.id
group by c.id;

-- Galerie et vue organisateur : une ligne par soumission, membres agreges.
create or replace view public.v_feed as
select s.id,
       s.client_id,
       s.challenge_id,
       c.name     as challenge_name,
       c.pillar,
       c.points,
       s.photo_path,
       s.note,
       s.quiz_attempts,
       s.created_at,
       s.submitter_id,
       (sp.first_name || ' ' || sp.last_name) as submitter_name,
       g.repeat_index,
       g.gauge_points,
       coalesce(
         (select array_agg(pa.first_name || ' ' || pa.last_name order by pa.first_name, pa.last_name)
            from public.submission_members m2
            join public.participants pa on pa.id = m2.participant_id
           where m2.submission_id = s.id),
         array[]::text[]
       ) as member_names,
       coalesce(
         (select array_agg(m3.participant_id::text)
            from public.submission_members m3 where m3.submission_id = s.id),
         array[]::text[]
       ) as member_ids
from public.submissions s
join public.challenges   c  on c.id = s.challenge_id
join public.participants sp on sp.id = s.submitter_id
left join public.v_submission_gauge g on g.submission_id = s.id;
