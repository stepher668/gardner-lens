"""
Multi-creator display formatting.

Covers OOUX doc "Open Items Carried Forward" #1 and #2:
  1. "Title / Creator / Year" needs a rule for how multiple creators with
     different roles render.
  2. Copy should avoid implying authorship a creator's role can't back up
     (e.g. a "subject" role, not a "maker" role).

The OOUX doc explicitly leaves the *exact* phrasing open (it gives one
example - "Workshop of X, with contributions attributed to Y" - as
illustrative, not final curatorial copy). The approved Claude Design export
(Gardner Lens.dc.html's `activeCreatorLine`) settles the practical case
actually in the pilot data: non-maker roles (e.g. Isabella Stewart Gardner
as "subject" on two portraits) are left out of the visible byline entirely,
not just de-emphasized - the export's own creator lists never include her
for those pieces. This function matches that visible outcome while still
returning the full role-qualified list separately (ArtworkDetailOut.creators)
for anything that wants it - so the "subject" relationship stays real data
for the OOUX Same-Creator pivot and the Phase 4 plant algorithm, it's just
not part of the Title/Creator/Year line itself.
"""
from __future__ import annotations

from dataclasses import dataclass

# Roles that imply the person/entity actually made the work, and so belong
# in the visible byline. Everything else (e.g. "subject") is honest to
# leave out of the byline rather than imply authorship it can't back up
# (OOUX Open Item 2) - it's still returned in the full creators list.
_MAKER_ROLES = {"artist", "author", "publisher", "editor", "maker", "workshop", "designer"}


@dataclass
class CreatorCredit:
    name: str
    role: str


def format_creator_display(credits: list[CreatorCredit]) -> str:
    makers = [c for c in credits if c.role.lower() in _MAKER_ROLES]

    if not makers:
        non_makers = [c for c in credits if c.role.lower() not in _MAKER_ROLES]
        if non_makers:
            return f"Artist unknown (depicts {non_makers[0].name})"
        return "Unknown"

    return ", ".join(m.name for m in makers)
