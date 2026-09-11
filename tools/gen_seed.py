#!/usr/bin/env python3
"""Genere supabase/04_seed.sql a partir des donnees du front end.

Le catalogue de defis vit dans js/data/*.js. Ce script en derive le seed SQL,
ce qui evite toute divergence entre ce que voient les joueurs et ce que la base
utilise pour calculer les points.

Usage : python3 tools/gen_seed.py
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import jsdata  # noqa: E402

s = jsdata.sql_str
a = jsdata.sql_arr

pillars = jsdata.pillars()
challenges = jsdata.challenges()
synergies = jsdata.synergies()

pin = os.environ.get("ORGANIZER_PIN", "")
if not pin:
    env = Path(__file__).resolve().parent.parent / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("ORGANIZER_PIN="):
                pin = line.split("=", 1)[1].strip()
if not pin:
    sys.exit("ORGANIZER_PIN introuvable (variable d'environnement ou .env)")

out = []
out.append("-- =====================================================================")
out.append("-- Seed des donnees de reference. GENERE AUTOMATIQUEMENT, ne pas editer.")
out.append("-- Source : js/data/pillars.js, js/data/challenges.js, js/data/synergies.js")
out.append("-- Regenerer avec : python3 tools/gen_seed.py")
out.append("-- Idempotent, peut etre rejoue sans danger.")
out.append("-- =====================================================================")
out.append("")

out.append("insert into public.pillars (id, name, short, max_points, sort_order, color, icon, blurb) values")
rows = [
    f"  ({s(p['id'])}, {s(p['name'])}, {s(p['short'])}, {p['max_points']}, "
    f"{p['sort_order']}, {s(p.get('color'))}, {s(p.get('icon'))}, {s(p.get('blurb'))})"
    for p in pillars
]
out.append(",\n".join(rows))
out.append("""on conflict (id) do update set
  name = excluded.name, short = excluded.short, max_points = excluded.max_points,
  sort_order = excluded.sort_order, color = excluded.color, icon = excluded.icon,
  blurb = excluded.blurb;""")
out.append("")

out.append("insert into public.challenges (id, pillar, name, style, tier, points, location_kind, location_detail, proof, sort_order) values")
rows = []
for i, c in enumerate(challenges, start=1):
    rows.append(
        f"  ({s(c['id'])}, {s(c['pillar'])}, {s(c['name'])}, {s(c['style'])}, "
        f"{s(c['tier'])}, {c['points']}, {s(c['location_kind'])}, "
        f"{s(c.get('location_detail'))}, {s(c['proof'])}, {i})"
    )
out.append(",\n".join(rows))
out.append("""on conflict (id) do update set
  pillar = excluded.pillar, name = excluded.name, style = excluded.style,
  tier = excluded.tier, points = excluded.points,
  location_kind = excluded.location_kind, location_detail = excluded.location_detail,
  proof = excluded.proof, sort_order = excluded.sort_order;""")
out.append("")

out.append("insert into public.synergies (id, name, pillar_a, pillar_b, triggers_a, triggers_b, personal_bonus, gauge_bonus, sort_order) values")
rows = [
    f"  ({s(y['id'])}, {s(y['name'])}, {s(y['pillar_a'])}, {s(y['pillar_b'])}, "
    f"{a(y['triggers_a'])}, {a(y['triggers_b'])}, {y['personal_bonus']}, "
    f"{y['gauge_bonus']}, {y['sort_order']})"
    for y in synergies
]
out.append(",\n".join(rows))
out.append("""on conflict (id) do update set
  name = excluded.name, pillar_a = excluded.pillar_a, pillar_b = excluded.pillar_b,
  triggers_a = excluded.triggers_a, triggers_b = excluded.triggers_b,
  personal_bonus = excluded.personal_bonus, gauge_bonus = excluded.gauge_bonus,
  sort_order = excluded.sort_order;""")
out.append("")

out.append("-- Retire du catalogue les defis qui ne sont plus dans le fichier source.")
out.append("delete from public.challenges where id <> all (" + a([c["id"] for c in challenges]) + ");")
out.append("delete from public.synergies  where id <> all (" + a([y["id"] for y in synergies]) + ");")
out.append("")

out.append("-- Remet les synergies d'aplomb apres tout changement de catalogue.")
out.append("select public.recompute_synergies();")
out.append("")

root = Path(__file__).resolve().parent.parent
target = root / "supabase" / "04_seed.sql"
target.write_text("\n".join(out), encoding="utf-8")

# Le code organisateur ne doit jamais etre committe : fichier local separe,
# exclu du depot par .gitignore.
local = root / "supabase" / "05_pin.local.sql"
local.write_text(
    "-- GENERE LOCALEMENT. Contient le code organisateur, jamais committe.\n"
    "insert into public.app_settings (key, value) values ('organizer_pin', "
    + s(pin)
    + ")\n  on conflict (key) do update set value = excluded.value;\n",
    encoding="utf-8",
)
local.chmod(0o600)

print(f"Ecrit {target}")
print(f"Ecrit {local} (local, hors depot)")
print(f"  {len(pillars)} piliers, {len(challenges)} defis, {len(synergies)} synergies")
