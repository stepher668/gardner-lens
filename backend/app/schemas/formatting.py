"""
Multi-creator display formatting.

Covers OOUX doc "Open Items Carried Forward" #1 and #2:
  1. "Title / Creator / Year" needs a rule for how multiple creators with
     different roles render.
  2. Copy should avoid implying authorship a creator's role can't back up
     (e.g. a "subject" role, not a "maker" role).

The OOUX doc explicitly leaves the *exact* phrasing open (it gives one
example - "Workshop of X, with contributions attributed to Y" - as
illustrative, not final curatorial copy). This module implements an honest,
conservative heuristic that satisfies both constraints above; swap it for
real curatorial phrasing conventions once the Museum provides them, without
touching any caller.
"""
from __future__ import annotations

from dataclasses import dataclass

# Roles that imply the person/entity actually made the work, and so belong
# in the visible byline. Everything else (e.g. "subject") is honest to
# mention only in a qualified way, never folded into a plain "by X" line.
_MAKER_ROLES = {"artist", "author", "publisher", "editor", "maker", "workshop", "designer"}


@dataclass
class CreatorCredit:
    name: str
    role: str


def format_creator_display(credits: list[CreatorCredit]) -> str:
    if not credits:
        return "Unknown"

    makers = [c for c in credits if c.role.lower() in _MAKER_ROLES]
    non_makers = [c for c in credits if c.role.lower() not in _MAKER_ROLES]

    if not makers:
        # Nothing with a maker-type role - be explicit rather than implying
        # authorship the data can't back up (OOUX Open Item 2).
        if non_makers:
            first = non_makers[0]
            return f"Artist unknown (depicts {first.name})"
        return "Unknown"

    if len(makers) == 1 and not non_makers:
        return makers[0].name

    parts = [makers[0].name]
    for extra in makers[1:]:
        parts.append(f"{extra.name} ({extra.role})")
    for subj in non_makers:
        parts.append(f"{subj.name} ({subj.role})")
    return ", ".join(parts)
