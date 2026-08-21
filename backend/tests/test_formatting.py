"""Direct unit tests for the multi-creator display formatting (OOUX doc
Open Items #1/#2). Kept independent of the seeded pilot dataset - the
formatting rule needs to be right regardless of whether the current pilot
data happens to contain a multi-creator example."""
from __future__ import annotations

from app.schemas.formatting import CreatorCredit, format_creator_display


def test_single_maker():
    assert format_creator_display([CreatorCredit(name="Rembrandt van Rijn", role="artist")]) == "Rembrandt van Rijn"


def test_maker_plus_subject_omits_subject_from_byline():
    """A "subject" role must never be folded into the byline as if they
    made the piece (OOUX Open Item 2) - the export's own approved
    behavior is to leave them out of Title/Creator/Year entirely, not
    just de-emphasize them."""
    credits = [
        CreatorCredit(name="John Singer Sargent", role="artist"),
        CreatorCredit(name="Isabella Stewart Gardner", role="subject"),
    ]
    assert format_creator_display(credits) == "John Singer Sargent"


def test_multiple_makers_all_shown():
    credits = [
        CreatorCredit(name="Workshop of X", role="workshop"),
        CreatorCredit(name="Y", role="artist"),
    ]
    assert format_creator_display(credits) == "Workshop of X, Y"


def test_subject_only_is_explicit_not_implied_authorship():
    credits = [CreatorCredit(name="Isabella Stewart Gardner", role="subject")]
    assert format_creator_display(credits) == "Artist unknown (depicts Isabella Stewart Gardner)"


def test_no_credits():
    assert format_creator_display([]) == "Unknown"
