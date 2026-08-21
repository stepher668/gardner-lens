from __future__ import annotations

import io

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

from app.seed.placeholder_images import generate_placeholder_image
from tests.conftest import artwork_id_by_title


def _random_noise_jpeg() -> bytes:
    rng = np.random.default_rng(42)
    arr = rng.integers(0, 255, size=(400, 400, 3), dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def test_health(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["reference_artworks_indexed"] == 7


def test_identify_confident_match_adds_to_collection(client: TestClient):
    photo_bytes = generate_placeholder_image("El Jaleo", "el-jaleo")

    resp = client.post("/identify", files={"photo": ("photo.jpg", photo_bytes, "image/jpeg")})
    assert resp.status_code == 200
    body = resp.json()
    assert body["tier"] == "confident"
    assert body["artwork"]["title"] == "El Jaleo"
    assert body["artwork"]["creator_display"] == "John Singer Sargent"
    session_id = body["session_id"]
    assert session_id

    collection = client.get(f"/collection/{session_id}").json()
    assert collection["count"] == 1
    assert collection["items"][0]["title"] == "El Jaleo"


def test_identify_no_match_does_not_touch_collection(client: TestClient):
    resp = client.post("/identify", files={"photo": ("noise.jpg", _random_noise_jpeg(), "image/jpeg")})
    assert resp.status_code == 200
    body = resp.json()
    assert body["tier"] == "no_match"
    assert body["artwork"] is None
    assert body["candidates"] is None

    collection = client.get(f"/collection/{body['session_id']}").json()
    assert collection["count"] == 0


def test_identify_confirm_flow_for_did_you_mean_selection(client: TestClient, db):
    """Simulates a visitor tapping a Tier 2 "Did You Mean?" candidate -
    confirms it and adds it to the collection, same as a direct Tier 1
    match would."""
    europa_id = artwork_id_by_title(db, "Europa")

    resp = client.post("/identify/confirm", json={"session_id": None, "artwork_id": europa_id})
    assert resp.status_code == 200
    body = resp.json()
    assert body["tier"] == "confident"
    assert body["artwork"]["id"] == europa_id

    collection = client.get(f"/collection/{body['session_id']}").json()
    assert collection["count"] == 1
    assert collection["items"][0]["title"] == "Europa"


def test_repeat_capture_of_same_piece_does_not_duplicate_collection_entry(client: TestClient):
    photo_bytes = generate_placeholder_image("El Jaleo", "el-jaleo")

    first = client.post("/identify", files={"photo": ("p.jpg", photo_bytes, "image/jpeg")}).json()
    session_id = first["session_id"]

    client.post(
        "/identify",
        data={"session_id": session_id},
        files={"photo": ("p2.jpg", photo_bytes, "image/jpeg")},
    )

    collection = client.get(f"/collection/{session_id}").json()
    assert collection["count"] == 1


def test_artwork_detail_multi_creator_display_is_honest(client: TestClient, db):
    """Portrait of Isabella Stewart Gardner: Sargent is the maker, Isabella
    Stewart Gardner is the subject. The byline (matching the approved
    Claude Design export) shows only the maker - it must never imply she
    made it (OOUX doc Open Item 2) - but the full creators list still
    carries both, roles intact, for anything that needs the complete data
    (e.g. the Phase 4 plant algorithm's Same-Creator-as-subject lookup)."""
    artwork_id = artwork_id_by_title(db, "Portrait of Isabella Stewart Gardner")

    resp = client.get(f"/artwork/{artwork_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["creator_display"] == "John Singer Sargent"
    assert len(body["creators"]) == 2
    assert {c["name"]: c["role"] for c in body["creators"]} == {
        "John Singer Sargent": "artist",
        "Isabella Stewart Gardner": "subject",
    }


def test_collection_unknown_session_returns_empty_state(client: TestClient):
    resp = client.get("/collection/does-not-exist")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 0
    assert body["items"] == []


def test_artwork_not_found_is_404(client: TestClient):
    resp = client.get("/artwork/does-not-exist")
    assert resp.status_code == 404
